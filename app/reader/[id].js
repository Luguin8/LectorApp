import { useEffect, useState, useRef, useCallback } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, TouchableOpacity, FlatList, Modal } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';

import { useReader } from '../../context/ReaderContext';
import books from '../../data/biblioteca.json';
import { bookFiles } from '../../utils/bookLoader';

export default function ReaderScreen() {
    const { id } = useLocalSearchParams();
    const insets = useSafeAreaInsets();

    const { theme, fontSize, fontFamily, toggleTheme, changeFontSize, isReady, saveProgress, lastChapter, bookmarks, toggleBookmark } = useReader();

    const [chapters, setChapters] = useState([]);
    const [loading, setLoading] = useState(true);

    const [menuVisible, setMenuVisible] = useState(false);
    const [showOnlyBookmarks, setShowOnlyBookmarks] = useState(false);

    const [isSpeaking, setIsSpeaking] = useState(false);
    const [currentVisibleIndex, setCurrentVisibleIndex] = useState(0);

    // VARIABLE PARA ACTIVAR/DESACTIVAR PUBLICIDAD FÁCILMENTE
    const showAds = true;

    const flatListRef = useRef(null);
    const hasScrolledRef = useRef(false);

    const bookData = books.find((b) => b.id === id);

    const isNight = theme === 'night';
    const bgColors = {
        main: isNight ? '#1a1a1a' : '#ffffff',
        text: isNight ? '#d1d1d1' : '#333333',
        title: isNight ? '#f4511e' : '#f4511e',
        controls: isNight ? '#333' : '#eee',
        controlText: isNight ? '#fff' : '#000',
        modalBg: isNight ? '#222' : '#fff',
        modalOverlay: isNight ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.5)',
        border: isNight ? '#444' : '#eee',
        // Color para el banner de publicidad simulado
        adBackground: isNight ? '#2a2a2a' : '#f0f0f0',
        adBorder: isNight ? '#444' : '#ccc'
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
        } else {
            const textToRead = chapters[currentVisibleIndex]?.content;
            if (textToRead) {
                const textChunks = chunkText(textToRead);
                setIsSpeaking(true);
                textChunks.forEach((chunk, index) => {
                    const isLastChunk = index === textChunks.length - 1;
                    Speech.speak(chunk, {
                        language: 'es-ES',
                        pitch: 1.0,
                        rate: 0.9,
                        onDone: isLastChunk ? () => setIsSpeaking(false) : undefined,
                        onStopped: () => setIsSpeaking(false),
                        onError: (e) => {
                            console.error("Error Speech:", e);
                            setIsSpeaking(false);
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

    return (
        <View style={[styles.container, { backgroundColor: bgColors.main }]}>
            <Stack.Screen options={{
                title: bookData.title,
                headerStyle: { backgroundColor: isNight ? '#000' : '#f4511e' },
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

            {/* --- AQUÍ ESTÁ EL ESPACIO PUBLICITARIO (MOCK) --- */}
            {/* Se muestra solo si showAds es true y no está cargando */}
            {showAds && !loading && (
                <View style={[styles.adContainer, { backgroundColor: bgColors.adBackground, borderColor: bgColors.adBorder }]}>
                    <Text style={{ color: bgColors.text, fontSize: 12, marginBottom: 4 }}>PUBLICIDAD</Text>
                    <View style={{ width: 320, height: 50, backgroundColor: '#ccc', justifyContent: 'center', alignItems: 'center' }}>
                        <Text style={{ color: '#666', fontWeight: 'bold' }}>Banner de Google Ads (320x50)</Text>
                    </View>
                </View>
            )}

            {loading || !isReady ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#f4511e" />
                </View>
            ) : (
                <FlatList
                    ref={flatListRef}
                    data={chapters}
                    keyExtractor={(item, index) => index.toString()}
                    contentContainerStyle={{ padding: 20, paddingBottom: 150 }}
                    onLayout={onListLayout}
                    onScrollToIndexFailed={onScrollToIndexFailed}
                    onViewableItemsChanged={onViewableItemsChanged}
                    viewabilityConfig={viewabilityConfig}
                    renderItem={({ item: chapter, index }) => (
                        <View style={styles.chapterContainer}>
                            <View style={styles.chapterHeader}>
                                {chapter.title && (
                                    <Text style={[styles.chapterTitle, { color: bgColors.title, fontFamily, flex: 1 }]}>
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

                            <Text style={[
                                styles.paragraph,
                                {
                                    fontSize: fontSize,
                                    color: bgColors.text,
                                    fontFamily: fontFamily,
                                    lineHeight: fontSize * 1.5
                                }
                            ]}>
                                {chapter.content ? chapter.content.replace(/\\n/g, '\n\n') : ''}
                            </Text>
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
                    paddingBottom: Math.max(insets.bottom, 20)
                }
            ]}>
                <TouchableOpacity onPress={() => changeFontSize('decrease')} style={styles.controlBtn}>
                    <Text style={[styles.btnText, { color: bgColors.controlText }]}>A-</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={toggleTheme} style={[styles.controlBtn, { flex: 2 }]}>
                    <Text style={[styles.btnText, { color: bgColors.controlText }]}>
                        {isNight ? 'Día ☀️' : 'Noche 🌙'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => changeFontSize('increase')} style={styles.controlBtn}>
                    <Text style={[styles.btnText, { color: bgColors.controlText }]}>A+</Text>
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
                            <Text style={[styles.modalTitle, { color: bgColors.text }]}>Índice</Text>
                            <TouchableOpacity onPress={() => setMenuVisible(false)}>
                                <Ionicons name="close" size={28} color={bgColors.text} />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={[
                                styles.filterBtn,
                                { backgroundColor: showOnlyBookmarks ? '#f4511e' : 'transparent', borderColor: '#f4511e' }
                            ]}
                            onPress={() => setShowOnlyBookmarks(!showOnlyBookmarks)}
                        >
                            <Ionicons name="star" size={18} color={showOnlyBookmarks ? '#fff' : '#f4511e'} style={{ marginRight: 8 }} />
                            <Text style={{ color: showOnlyBookmarks ? '#fff' : '#f4511e', fontWeight: 'bold' }}>
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
                                    <Text style={[
                                        styles.menuItemText,
                                        {
                                            color: isBookmarked(item.originalIndex) ? '#f4511e' : bgColors.text,
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
    // ESTILOS NUEVOS PARA EL AD
    adContainer: {
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
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
        textAlign: 'left',
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
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
    },
    btnText: {
        fontSize: 16,
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