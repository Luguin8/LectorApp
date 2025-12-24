import { useEffect, useState, useRef, useCallback } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, TouchableOpacity, FlatList } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// Importamos iconos para la estrellita
import { Ionicons } from '@expo/vector-icons';

import { useReader } from '../../context/ReaderContext';
import books from '../../data/biblioteca.json';
import { bookFiles } from '../../utils/bookLoader';

export default function ReaderScreen() {
    const { id } = useLocalSearchParams();
    const insets = useSafeAreaInsets();

    // Traemos 'bookmarks' y 'toggleBookmark'
    const { theme, fontSize, fontFamily, toggleTheme, changeFontSize, isReady, saveProgress, lastChapter, bookmarks, toggleBookmark } = useReader();

    const [chapters, setChapters] = useState([]);
    const [loading, setLoading] = useState(true);

    const flatListRef = useRef(null);
    const hasScrolledRef = useRef(false);

    const bookData = books.find((b) => b.id === id);

    const isNight = theme === 'night';
    const bgColors = {
        main: isNight ? '#1a1a1a' : '#ffffff',
        text: isNight ? '#d1d1d1' : '#333333',
        title: isNight ? '#f4511e' : '#f4511e',
        controls: isNight ? '#333' : '#eee',
        controlText: isNight ? '#fff' : '#000'
    };

    useEffect(() => {
        loadBookContent();
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

    const onListLayout = () => {
        if (loading || chapters.length === 0 || hasScrolledRef.current) return;
        if (lastChapter && lastChapter.bookId === id) {
            console.log("🔄 Restaurando capítulo:", lastChapter.chapterIndex);
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
            }
        }
    }, [id, saveProgress]);

    const viewabilityConfig = useRef({
        itemVisiblePercentThreshold: 0,
        minimumViewTime: 500
    }).current;

    // Helper para saber si un capitulo está marcado
    const isBookmarked = (index) => {
        const bookBookmarks = bookmarks[id] || [];
        return bookBookmarks.includes(index);
    };

    if (!bookData) return <View style={styles.center}><Text>No existe</Text></View>;

    return (
        <View style={[styles.container, { backgroundColor: bgColors.main }]}>
            <Stack.Screen options={{
                title: bookData.title,
                headerStyle: { backgroundColor: isNight ? '#000' : '#f4511e' },
                headerTintColor: '#fff'
            }} />

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

                            {/* HEADER DEL CAPÍTULO CON BOTÓN DE FAVORITO */}
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
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    chapterContainer: { marginBottom: 30 },
    // Estilos nuevos para el titulo + icono
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
        textAlign: 'center' // O left, según prefieras
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
    }
});