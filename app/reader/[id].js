import { useEffect, useState, useRef, useCallback } from 'react';
import {
    StyleSheet, Text, View, ActivityIndicator,
    TouchableOpacity, FlatList, Modal, useWindowDimensions
} from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';

import AdBanner, { BannerAdSize } from '../../components/AdBanner';
import { useReader } from '../../context/ReaderContext';
import books from '../../data/biblioteca.json';
import { bookFiles } from '../../utils/bookLoader';

const AD_UNIT_TOP = 'ca-app-pub-2263615536540210/6379943534';
const AD_UNIT_RECT = 'ca-app-pub-2263615536540210/4636467089';

const PRIMARY_DAY = '#691a35';
const PRIMARY_NIGHT = '#81c784';

export default function ReaderScreen() {
    const { id } = useLocalSearchParams();
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();

    const {
        theme, fontSize, textAlign, toggleTextAlign,
        toggleTheme, changeFontSize, isReady,
        saveProgress, lastChapter, bookmarks, toggleBookmark
    } = useReader();

    const [chapters, setChapters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [menuVisible, setMenuVisible] = useState(false);
    const [showOnlyBookmarks, setShowOnlyBookmarks] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [currentVisibleIndex, setCurrentVisibleIndex] = useState(0);
    const [readingChapterIndex, setReadingChapterIndex] = useState(null);

    const flatListRef = useRef(null);
    const hasScrolledRef = useRef(false);

    const bookData = books.find((b) => b.id === id);

    const isNight = theme === 'night';
    const currentPrimary = isNight ? PRIMARY_NIGHT : PRIMARY_DAY;

    // En landscape/tablet, el contenido tiene márgenes laterales más amplios
    const isWide = width > 600;
    const contentPaddingH = isWide ? Math.min(width * 0.12, 80) : 20;

    const bgColors = {
        main: isNight ? '#1a1a1a' : '#faf8f5',
        text: isNight ? '#d1d1d1' : '#2c1a11',
        title: currentPrimary,
        controls: isNight ? '#252525' : '#f3ede8',
        controlText: isNight ? '#fff' : '#2c1a11',
        modalBg: isNight ? '#222' : '#fff',
        modalOverlay: isNight ? 'rgba(0,0,0,0.85)' : 'rgba(0,0,0,0.5)',
        border: isNight ? '#3a3a3a' : '#e0d6cf',
        adBackground: isNight ? '#2a2a2a' : '#ede8e3',
        readingHighlight: currentPrimary,
    };

    useEffect(() => {
        loadBookContent();
        return () => {
            Speech.stop();
        };
    }, [id]);

    const loadBookContent = () => {
        try {
            const bookContent = bookFiles[id];
            if (!bookContent) {
                // Volvemos a la biblioteca si el libro no existe
                router.replace('/');
                return;
            }
            setChapters(bookContent);
        } catch (error) {
            router.replace('/');
        } finally {
            setLoading(false);
        }
    };

    // Divide el texto en chunks para el TTS (límite de la API de Speech)
    const chunkText = (text, limit = 3000) => {
        const chunks = [];
        let start = 0;
        while (start < text.length) {
            let end = Math.min(start + limit, text.length);
            if (end < text.length) {
                const lastSpace = text.lastIndexOf(' ', end);
                if (lastSpace > start) end = lastSpace;
            }
            chunks.push(text.slice(start, end));
            start = end + 1;
        }
        return chunks;
    };

    const handleSpeech = () => {
        if (isSpeaking) {
            Speech.stop();
            setIsSpeaking(false);
            setReadingChapterIndex(null);
        } else {
            const textToRead = chapters[currentVisibleIndex]?.content;
            if (!textToRead) return;

            setReadingChapterIndex(currentVisibleIndex);
            setIsSpeaking(true);

            const chunks = chunkText(textToRead);
            chunks.forEach((chunk, index) => {
                const isLast = index === chunks.length - 1;
                Speech.speak(chunk, {
                    language: 'es-ES',
                    pitch: 1.0,
                    rate: 0.9,
                    onDone: isLast ? () => {
                        setIsSpeaking(false);
                        setReadingChapterIndex(null);
                    } : undefined,
                    onStopped: () => {
                        setIsSpeaking(false);
                        setReadingChapterIndex(null);
                    },
                    onError: () => {
                        setIsSpeaking(false);
                        setReadingChapterIndex(null);
                    },
                });
            });
        }
    };

    const onListLayout = () => {
        if (loading || chapters.length === 0 || hasScrolledRef.current) return;
        if (lastChapter && lastChapter.bookId === id && lastChapter.chapterIndex > 0) {
            setTimeout(() => {
                flatListRef.current?.scrollToIndex({
                    index: lastChapter.chapterIndex,
                    animated: false,
                    viewPosition: 0,
                });
                hasScrolledRef.current = true;
            }, 150);
        }
    };

    const onScrollToIndexFailed = ({ index }) => {
        setTimeout(() => {
            flatListRef.current?.scrollToIndex({ index, animated: false });
        }, 500);
    };

    // Ref estable para no causar re-renders en FlatList
    const onViewableItemsChangedRef = useRef(({ viewableItems }) => {
        if (viewableItems.length > 0) {
            const item = viewableItems[0];
            if (item.index != null) {
                setCurrentVisibleIndex(item.index);
                saveProgress(id, item.index);
            }
        }
    });

    const viewabilityConfig = useRef({
        itemVisiblePercentThreshold: 10,
        minimumViewTime: 600,
    }).current;

    const isBookmarked = (index) => (bookmarks[id] || []).includes(index);

    const goToChapter = (index) => {
        setMenuVisible(false);
        Speech.stop();
        setIsSpeaking(false);
        setReadingChapterIndex(null);
        setTimeout(() => {
            flatListRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0 });
        }, 300);
    };

    const getFilteredChapters = () => {
        const mapped = chapters.map((c, i) => ({ ...c, originalIndex: i }));
        return showOnlyBookmarks ? mapped.filter(item => isBookmarked(item.originalIndex)) : mapped;
    };

    const shouldShowAd = (index) => (index + 1) % 5 === 0;

    if (!bookData) return null;

    return (
        <View style={[styles.container, { backgroundColor: bgColors.main }]}>
            <Stack.Screen options={{
                title: bookData.title,
                headerStyle: { backgroundColor: isNight ? '#111' : PRIMARY_DAY },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: 'bold', fontSize: 16 },
                headerRight: () => (
                    <View style={styles.headerRight}>
                        <TouchableOpacity
                            onPress={handleSpeech}
                            style={styles.headerBtn}
                            accessibilityLabel={isSpeaking ? 'Detener lectura' : 'Leer en voz alta'}
                        >
                            <Ionicons
                                name={isSpeaking ? 'stop-circle' : 'headset'}
                                size={26}
                                color="#fff"
                            />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setMenuVisible(true)}
                            style={styles.headerBtn}
                            accessibilityLabel="Índice de capítulos"
                        >
                            <Ionicons name="list" size={26} color="#fff" />
                        </TouchableOpacity>
                    </View>
                ),
            }} />

            {/* Banner superior */}
            {!loading && (
                <View style={[styles.adContainer, { borderBottomColor: bgColors.border, borderBottomWidth: 1 }]}>
                    <AdBanner unitId={AD_UNIT_TOP} size={BannerAdSize.BANNER} />
                </View>
            )}

            {loading || !isReady ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={currentPrimary} />
                </View>
            ) : (
                <FlatList
                    ref={flatListRef}
                    data={chapters}
                    keyExtractor={(_, index) => index.toString()}
                    contentContainerStyle={{
                        paddingHorizontal: contentPaddingH,
                        paddingTop: 24,
                        paddingBottom: 120 + insets.bottom,
                    }}
                    onLayout={onListLayout}
                    onScrollToIndexFailed={onScrollToIndexFailed}
                    onViewableItemsChanged={onViewableItemsChangedRef.current}
                    viewabilityConfig={viewabilityConfig}
                    renderItem={({ item: chapter, index }) => (
                        <View style={[
                            styles.chapterContainer,
                            index === readingChapterIndex && {
                                borderColor: bgColors.readingHighlight,
                                borderWidth: 2,
                                borderRadius: 10,
                                padding: 10,
                            }
                        ]}>
                            <View style={styles.chapterHeader}>
                                {chapter.title ? (
                                    <Text
                                        allowFontScaling={false}
                                        style={[styles.chapterTitle, { color: bgColors.title, flex: 1 }]}
                                    >
                                        {chapter.title}
                                    </Text>
                                ) : null}
                                <TouchableOpacity
                                    onPress={() => toggleBookmark(id, index)}
                                    style={styles.bookmarkBtn}
                                    accessibilityLabel={isBookmarked(index) ? 'Quitar favorito' : 'Agregar a favoritos'}
                                >
                                    <Ionicons
                                        name={isBookmarked(index) ? 'star' : 'star-outline'}
                                        size={26}
                                        color={isBookmarked(index) ? '#FFD700' : (isNight ? '#555' : '#ccc')}
                                    />
                                </TouchableOpacity>
                            </View>

                            <Text
                                selectable
                                allowFontScaling={false}
                                textBreakStrategy="highQuality"
                                hyphenationFrequency="full"
                                style={[
                                    styles.paragraph,
                                    {
                                        fontSize: fontSize,
                                        color: bgColors.text,
                                        lineHeight: fontSize * 1.85,
                                        textAlign: textAlign,
                                    }
                                ]}
                            >
                                {chapter.content ? chapter.content.replace(/\\n/g, '\n\n') + ' ' : ''}
                            </Text>

                            {shouldShowAd(index) && (
                                <View style={[styles.adContainer, { marginVertical: 24 }]}>
                                    <AdBanner unitId={AD_UNIT_RECT} size={BannerAdSize.MEDIUM_RECTANGLE} />
                                </View>
                            )}

                            <View style={[styles.separator, { backgroundColor: bgColors.border }]} />
                        </View>
                    )}
                />
            )}

            {/* Barra de controles inferior */}
            <View style={[
                styles.controlsBar,
                {
                    backgroundColor: bgColors.controls,
                    borderTopColor: bgColors.border,
                    paddingBottom: Math.max(insets.bottom, 12),
                    paddingHorizontal: isWide ? contentPaddingH : 8,
                }
            ]}>
                <TouchableOpacity
                    onPress={() => changeFontSize('decrease')}
                    style={styles.controlBtn}
                    accessibilityLabel="Reducir tamaño de texto"
                >
                    <Text allowFontScaling={false} style={[styles.btnText, { color: bgColors.controlText }]}>A-</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={toggleTheme}
                    style={[styles.controlBtn, styles.controlBtnWide]}
                    accessibilityLabel={isNight ? 'Cambiar a modo día' : 'Cambiar a modo noche'}
                >
                    <Ionicons
                        name={isNight ? 'sunny' : 'moon'}
                        size={18}
                        color={bgColors.controlText}
                        style={{ marginRight: 6 }}
                    />
                    <Text allowFontScaling={false} style={[styles.btnText, { color: bgColors.controlText }]}>
                        {isNight ? 'Día' : 'Noche'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={toggleTextAlign}
                    style={styles.controlBtn}
                    accessibilityLabel={textAlign === 'justify' ? 'Alineación izquierda' : 'Texto justificado'}
                >
                    <Ionicons
                        name={textAlign === 'justify' ? 'reorder-four' : 'reorder-three'}
                        size={24}
                        color={bgColors.controlText}
                    />
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => changeFontSize('increase')}
                    style={styles.controlBtn}
                    accessibilityLabel="Aumentar tamaño de texto"
                >
                    <Text allowFontScaling={false} style={[styles.btnText, { color: bgColors.controlText }]}>A+</Text>
                </TouchableOpacity>
            </View>

            {/* Modal de índice */}
            <Modal
                animationType="slide"
                transparent
                visible={menuVisible}
                onRequestClose={() => setMenuVisible(false)}
                statusBarTranslucent
            >
                <View style={[styles.modalOverlay, { backgroundColor: bgColors.modalOverlay }]}>
                    <View style={[
                        styles.modalContent,
                        {
                            backgroundColor: bgColors.modalBg,
                            width: isWide ? Math.min(500, width * 0.8) : '100%',
                            alignSelf: isWide ? 'center' : undefined,
                            borderRadius: isWide ? 16 : undefined,
                            borderTopLeftRadius: isWide ? 16 : 20,
                            borderTopRightRadius: isWide ? 16 : 20,
                        }
                    ]}>
                        <View style={[styles.modalHeader, { borderBottomColor: bgColors.border }]}>
                            <Text allowFontScaling={false} style={[styles.modalTitle, { color: bgColors.text }]}>
                                Índice
                            </Text>
                            <TouchableOpacity
                                onPress={() => setMenuVisible(false)}
                                accessibilityLabel="Cerrar índice"
                            >
                                <Ionicons name="close" size={28} color={bgColors.text} />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={[
                                styles.filterBtn,
                                {
                                    backgroundColor: showOnlyBookmarks ? currentPrimary : 'transparent',
                                    borderColor: currentPrimary,
                                }
                            ]}
                            onPress={() => setShowOnlyBookmarks(!showOnlyBookmarks)}
                        >
                            <Ionicons
                                name="star"
                                size={16}
                                color={showOnlyBookmarks ? '#fff' : currentPrimary}
                                style={{ marginRight: 6 }}
                            />
                            <Text
                                allowFontScaling={false}
                                style={{ color: showOnlyBookmarks ? '#fff' : currentPrimary, fontWeight: '600', fontSize: 14 }}
                            >
                                {showOnlyBookmarks ? 'Mostrando Favoritos' : 'Ver solo Favoritos'}
                            </Text>
                        </TouchableOpacity>

                        <FlatList
                            data={getFilteredChapters()}
                            keyExtractor={(item) => item.originalIndex.toString()}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[styles.menuItem, { borderBottomColor: bgColors.border }]}
                                    onPress={() => goToChapter(item.originalIndex)}
                                >
                                    <Text
                                        allowFontScaling={false}
                                        style={[
                                            styles.menuItemText,
                                            {
                                                color: isBookmarked(item.originalIndex) ? currentPrimary : bgColors.text,
                                                flex: 1,
                                            }
                                        ]}
                                        numberOfLines={2}
                                    >
                                        {item.title || `Capítulo ${item.originalIndex + 1}`}
                                    </Text>
                                    {isBookmarked(item.originalIndex) && (
                                        <Ionicons name="star" size={18} color="#FFD700" />
                                    )}
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={() => (
                                <View style={styles.emptyList}>
                                    <Text style={{ color: bgColors.text, opacity: 0.5, textAlign: 'center' }}>
                                        No tenés capítulos marcados como favoritos aún.
                                    </Text>
                                </View>
                            )}
                        />
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    headerRight: { flexDirection: 'row', alignItems: 'center' },
    headerBtn: { padding: 8, marginLeft: 2 },
    adContainer: { alignItems: 'center', justifyContent: 'center', width: '100%' },
    chapterContainer: { marginBottom: 24 },
    chapterHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
        marginTop: 8,
    },
    chapterTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        lineHeight: 28,
    },
    bookmarkBtn: { padding: 6, marginLeft: 8 },
    paragraph: {},
    separator: {
        height: 1,
        marginVertical: 28,
        width: '70%',
        alignSelf: 'center',
        opacity: 0.6,
    },
    controlsBar: {
        flexDirection: 'row',
        paddingTop: 10,
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        justifyContent: 'space-around',
        alignItems: 'center',
        borderTopWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 12,
        zIndex: 999,
    },
    controlBtn: {
        padding: 8,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 44,
        minHeight: 44,
    },
    controlBtnWide: {
        flexDirection: 'row',
        paddingHorizontal: 14,
    },
    btnText: {
        fontSize: 15,
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    modalContent: {
        height: '80%',
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
        elevation: 8,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 14,
        borderBottomWidth: 1,
        marginBottom: 12,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    filterBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
        borderRadius: 10,
        borderWidth: 1.5,
        marginBottom: 14,
    },
    menuItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
    },
    menuItemText: {
        fontSize: 15,
        lineHeight: 20,
    },
    emptyList: {
        padding: 30,
    },
});