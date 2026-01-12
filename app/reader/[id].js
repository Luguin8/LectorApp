import { useEffect, useState, useRef, useCallback } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, TouchableOpacity, FlatList, Modal, Dimensions } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

import { useReader } from '../../context/ReaderContext';
import books from '../../data/biblioteca.json';
import { bookFiles } from '../../utils/bookLoader';

const AD_UNIT_TOP = 'ca-app-pub-2263615536540210/6379943534';
const AD_UNIT_RECT = 'ca-app-pub-2263615536540210/4636467089';

// --- COLORES PRINCIPALES ---
const PRIMARY_DAY = '#691a35';
const PRIMARY_NIGHT = '#81c784';

export default function ReaderScreen() {
    const { id } = useLocalSearchParams();
    const insets = useSafeAreaInsets();

    const { theme, fontSize, fontFamily, textAlign, toggleTextAlign, toggleTheme, changeFontSize, isReady, saveProgress, lastChapter, bookmarks, toggleBookmark } = useReader();

    const [chapters, setChapters] = useState([]);
    const [loading, setLoading] = useState(true);

    const [menuVisible, setMenuVisible] = useState(false);
    const [showOnlyBookmarks, setShowOnlyBookmarks] = useState(false);

    const [isSpeaking, setIsSpeaking] = useState(false);
    const [currentVisibleIndex, setCurrentVisibleIndex] = useState(0);

    const [readingChapterIndex, setReadingChapterIndex] = useState(null);

    const showAds = true;

    const flatListRef = useRef(null);
    const hasScrolledRef = useRef(false);

    const bookData = books.find((b) => b.id === id);

    const isNight = theme === 'night';
    const currentPrimary = isNight ? PRIMARY_NIGHT : PRIMARY_DAY;

    const bgColors = {
        main: isNight ? '#1a1a1a' : '#ffffff',
        text: isNight ? '#d1d1d1' : '#333333',
        title: currentPrimary,
        controls: isNight ? '#333' : '#f2f2f2',
        controlText: isNight ? '#fff' : '#000',
        modalBg: isNight ? '#222' : '#fff',
        modalOverlay: isNight ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.5)',
        border: isNight ? '#444' : '#eee',
        // Los colores de AdBackground ya no se usan porque el Banner es nativo, pero los dejamos por si acaso
        adBackground: isNight ? '#2a2a2a' : '#f0f0f0',
        adBorder: isNight ? '#444' : '#ccc',
        readingHighlight: currentPrimary
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
                alert("Error: No se encontró el contenido.");
                return;
            }
            setChapters(bookContent);
        } catch (error) {
            console.error("Error cargando libro:", error);
        } finally {
            setLoading(false);
        }
    };

    const chunkText = (text, limit = 3000) => {
        const chunks = [];
        let start = 0;
        while (start < text.length) {
            let end = Math.min(start + limit, text.length);
            if (end < text.length) {
                const lastSpace = text.lastIndexOf(' ', end);
                if (lastSpace > start) {
                    end = lastSpace;
                }
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
            const indexToRead = currentVisibleIndex;
            const textToRead = chapters[indexToRead]?.content;

            if (textToRead) {
                setReadingChapterIndex(indexToRead);
                const textChunks = chunkText(textToRead);
                setIsSpeaking(true);

                textChunks.forEach((chunk, index) => {
                    const isLastChunk = index === textChunks.length - 1;
                    Speech.speak(chunk, {
                        language: 'es-ES',
                        pitch: 1.0,
                        rate: 0.9,
                        onDone: isLastChunk ? () => {
                            setIsSpeaking(false);
                            setReadingChapterIndex(null);
                        } : undefined,
                        onStopped: () => {
                            setIsSpeaking(false);
                            setReadingChapterIndex(null);
                        },
                        onError: (e) => {
                            console.error("Error Speech:", e);
                            setIsSpeaking(false);
                            setReadingChapterIndex(null);
                        }
                    });
                });
            }
        }
    };

    const onListLayout = () => {
        if (loading || chapters.length === 0 || hasScrolledRef.current) return;
        if (lastChapter && lastChapter.bookId === id) {
            setTimeout(() => {
                flatListRef.current?.scrollToIndex({
                    index: lastChapter.chapterIndex,
                    animated: false,
                    viewPosition: 0
                });
                hasScrolledRef.current = true;
            }, 100);
        }
    };

    const onScrollToIndexFailed = (info) => {
        const wait = new Promise(resolve => setTimeout(resolve, 500));
        wait.then(() => {
            flatListRef.current?.scrollToIndex({ index: info.index, animated: false });
        });
    };

    const onViewableItemsChanged = useCallback(({ viewableItems }) => {
        if (viewableItems.length > 0) {
            const visibleItem = viewableItems[0];
            if (visibleItem.index !== null && visibleItem.index !== undefined) {
                saveProgress(id, visibleItem.index);
                setCurrentVisibleIndex(visibleItem.index);
            }
        }
    }, [id, saveProgress]);

    const viewabilityConfig = useRef({
        itemVisiblePercentThreshold: 0,
        minimumViewTime: 500
    }).current;

    const isBookmarked = (index) => {
        const bookBookmarks = bookmarks[id] || [];
        return bookBookmarks.includes(index);
    };

    const goToChapter = (index) => {
        setMenuVisible(false);
        Speech.stop();
        setIsSpeaking(false);
        setReadingChapterIndex(null);
        setTimeout(() => {
            flatListRef.current?.scrollToIndex({
                index: index,
                animated: true,
                viewPosition: 0
            });
        }, 300);
    };

    const getFilteredChapters = () => {
        if (!showOnlyBookmarks) return chapters.map((c, i) => ({ ...c, originalIndex: i }));
        return chapters
            .map((c, i) => ({ ...c, originalIndex: i }))
            .filter(item => isBookmarked(item.originalIndex));
    };

    if (!bookData) return <View style={styles.center}><Text>No existe</Text></View>;

    const shouldShowAd = (index) => {
        return showAds && ((index + 1) % 5 === 0);
    };

    return (
        <View style={[styles.container, { backgroundColor: bgColors.main }]}>
            <Stack.Screen options={{
                title: bookData.title,
                headerStyle: { backgroundColor: isNight ? '#000' : PRIMARY_DAY },
                headerTintColor: '#fff',
                headerRight: () => (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <TouchableOpacity onPress={handleSpeech} style={{ marginRight: 15 }}>
                            <Ionicons name={isSpeaking ? "stop-circle" : "headset"} size={28} color="#fff" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setMenuVisible(true)} style={{ marginRight: 10 }}>
                            <Ionicons name="list" size={28} color="#fff" />
                        </TouchableOpacity>
                    </View>
                )
            }} />

            {/* AD BANNER SUPERIOR (REAL) */}
            {showAds && !loading && (
                <View style={[styles.adContainer, { backgroundColor: isNight ? '#000' : '#fff', borderBottomWidth: 1, borderColor: bgColors.border }]}>
                    <BannerAd
                        unitId={AD_UNIT_TOP}
                        size={BannerAdSize.BANNER} // Tamaño estándar 320x50
                        requestOptions={{ requestNonPersonalizedAdsOnly: true }}
                    />
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
                    keyExtractor={(item, index) => index.toString()}
                    contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 250 }}
                    onLayout={onListLayout}
                    onScrollToIndexFailed={onScrollToIndexFailed}
                    onViewableItemsChanged={onViewableItemsChanged}
                    viewabilityConfig={viewabilityConfig}
                    renderItem={({ item: chapter, index }) => (
                        <View style={[
                            styles.chapterContainer,
                            index === readingChapterIndex && {
                                borderColor: bgColors.readingHighlight,
                                borderWidth: 2,
                                borderRadius: 8,
                                padding: 8,
                                borderStyle: 'solid'
                            }
                        ]}>
                            <View style={styles.chapterHeader}>
                                {chapter.title && (
                                    <Text
                                        allowFontScaling={false}
                                        style={[styles.chapterTitle, { color: bgColors.title, fontFamily, flex: 1 }]}
                                    >
                                        {chapter.title}
                                    </Text>
                                )}
                                <TouchableOpacity onPress={() => toggleBookmark(id, index)} style={styles.bookmarkBtn}>
                                    <Ionicons
                                        name={isBookmarked(index) ? "star" : "star-outline"}
                                        size={28}
                                        color={isBookmarked(index) ? "#FFD700" : (isNight ? "#555" : "#ccc")}
                                    />
                                </TouchableOpacity>
                            </View>

                            <View style={{ flex: 1 }}>
                                <Text
                                    selectable={true}
                                    allowFontScaling={false}
                                    textBreakStrategy="highQuality"
                                    hyphenationFrequency="full"
                                    style={[
                                        styles.paragraph,
                                        {
                                            fontSize: fontSize,
                                            color: bgColors.text,
                                            fontFamily: fontFamily,
                                            lineHeight: fontSize * 1.8,
                                            textAlign: textAlign,
                                        }
                                    ]}
                                >
                                    {chapter.content ? chapter.content.replace(/\\n/g, '\n\n') + ' ' : ''}
                                </Text>
                            </View>

                            {/* AD RECTANGULAR (REAL) - SOLO SI ES MÚLTIPLO DE 5 */}
                            {shouldShowAd(index) && (
                                <View style={[styles.adContainer, { marginVertical: 30 }]}>
                                    <BannerAd
                                        unitId={AD_UNIT_RECT}
                                        size={BannerAdSize.MEDIUM_RECTANGLE} // Tamaño 300x250
                                        requestOptions={{ requestNonPersonalizedAdsOnly: true }}
                                    />
                                </View>
                            )}

                            <View style={[styles.separator, { backgroundColor: isNight ? '#444' : '#eee' }]} />
                        </View>
                    )}
                />
            )}

            <View style={[
                styles.controlsBar,
                {
                    backgroundColor: bgColors.controls,
                    borderTopColor: isNight ? '#444' : '#ccc',
                    paddingBottom: Math.max(insets.bottom, 20),
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: -3 },
                    shadowOpacity: 0.1,
                    shadowRadius: 3,
                    elevation: 10,
                    zIndex: 999
                }
            ]}>
                <TouchableOpacity onPress={() => changeFontSize('decrease')} style={styles.controlBtn}>
                    <Text allowFontScaling={false} style={[styles.btnText, { color: bgColors.controlText }]}>A-</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={toggleTheme} style={[styles.controlBtn, { flex: 1.5 }]}>
                    <Text allowFontScaling={false} style={[styles.btnText, { color: bgColors.controlText }]}>
                        {isNight ? 'Día' : 'Noche'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={toggleTextAlign} style={[styles.controlBtn, { flex: 0.8 }]}>
                    <Ionicons
                        name={textAlign === 'justify' ? "reorder-four" : "list"}
                        size={26}
                        color={bgColors.controlText}
                    />
                </TouchableOpacity>

                <TouchableOpacity onPress={() => changeFontSize('increase')} style={styles.controlBtn}>
                    <Text allowFontScaling={false} style={[styles.btnText, { color: bgColors.controlText }]}>A+</Text>
                </TouchableOpacity>
            </View>

            <Modal
                animationType="slide"
                transparent={true}
                visible={menuVisible}
                onRequestClose={() => setMenuVisible(false)}
            >
                <View style={[styles.modalOverlay, { backgroundColor: bgColors.modalOverlay }]}>
                    <View style={[styles.modalContent, { backgroundColor: bgColors.modalBg }]}>
                        <View style={[styles.modalHeader, { borderBottomColor: bgColors.border }]}>
                            <Text allowFontScaling={false} style={[styles.modalTitle, { color: bgColors.text }]}>Índice</Text>
                            <TouchableOpacity onPress={() => setMenuVisible(false)}>
                                <Ionicons name="close" size={28} color={bgColors.text} />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={[
                                styles.filterBtn,
                                {
                                    backgroundColor: showOnlyBookmarks ? currentPrimary : 'transparent',
                                    borderColor: currentPrimary
                                }
                            ]}
                            onPress={() => setShowOnlyBookmarks(!showOnlyBookmarks)}
                        >
                            <Ionicons name="star" size={18} color={showOnlyBookmarks ? (isNight ? '#000' : '#fff') : currentPrimary} style={{ marginRight: 8 }} />
                            <Text allowFontScaling={false} style={{ color: showOnlyBookmarks ? (isNight ? '#000' : '#fff') : currentPrimary, fontWeight: 'bold' }}>
                                {showOnlyBookmarks ? "Mostrando solo Favoritos" : "Mostrar solo Favoritos"}
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
                                    <Text allowFontScaling={false} style={[
                                        styles.menuItemText,
                                        {
                                            color: isBookmarked(item.originalIndex) ? currentPrimary : bgColors.text,
                                            flex: 1
                                        }
                                    ]}>
                                        {item.title || `Capítulo ${item.originalIndex + 1}`}
                                    </Text>

                                    {isBookmarked(item.originalIndex) && (
                                        <View pointerEvents="none">
                                            <Ionicons name="star" size={20} color="#FFD700" />
                                        </View>
                                    )}
                                </TouchableOpacity>
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
    adContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        width: '100%',
    },
    chapterContainer: { marginBottom: 30 },
    chapterHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
        marginTop: 10,
    },
    chapterTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        textAlign: 'center'
    },
    bookmarkBtn: {
        padding: 5,
        marginLeft: 10
    },
    paragraph: {
        // TextAlign manejado dinámicamente
    },
    separator: {
        height: 1,
        marginVertical: 30,
        width: '80%',
        alignSelf: 'center'
    },
    controlsBar: {
        flexDirection: 'row',
        padding: 15,
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
    },
    controlBtn: {
        padding: 5,
        borderRadius: 5,
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
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
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 15,
        borderBottomWidth: 1,
        marginBottom: 10
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
        borderRadius: 8,
        borderWidth: 1,
        marginBottom: 15
    },
    menuItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
    },
    menuItemText: {
        fontSize: 16,
    }
});