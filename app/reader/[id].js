import { useEffect, useState, useRef, useCallback } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, TouchableOpacity, FlatList } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useReader } from '../../context/ReaderContext';
import books from '../../data/biblioteca.json';
import { bookFiles } from '../../utils/bookLoader';

export default function ReaderScreen() {
    const { id } = useLocalSearchParams();
    const insets = useSafeAreaInsets();

    // Traemos todo del contexto
    const { theme, fontSize, fontFamily, toggleTheme, changeFontSize, isReady, saveProgress, lastChapter } = useReader();

    const [chapters, setChapters] = useState([]);
    const [loading, setLoading] = useState(true);

    const flatListRef = useRef(null);
    // Usamos esto para asegurar que el scroll ocurra solo una vez
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

    // --- LÓGICA DE RESTAURACIÓN (SCROLL) ---
    // Esta función se llama cuando la lista termina de "pintarse" en pantalla
    const onListLayout = () => {
        if (loading || chapters.length === 0 || hasScrolledRef.current) return;

        // Verificamos si hay algo guardado para ESTE libro
        if (lastChapter && lastChapter.bookId === id) {
            console.log("🔄 INTENTANDO RESTAURAR al capítulo:", lastChapter.chapterIndex);

            // Pequeño delay de seguridad
            setTimeout(() => {
                flatListRef.current?.scrollToIndex({
                    index: lastChapter.chapterIndex,
                    animated: false,
                    viewPosition: 0
                });
                hasScrolledRef.current = true;
            }, 100);
        } else {
            console.log("ℹ️ No hay progreso guardado previo para este libro.");
        }
    };

    // Manejo de errores si el scroll falla (común en listas largas)
    const onScrollToIndexFailed = (info) => {
        console.log("⚠️ Falló el scroll directo, reintentando...", info);
        const wait = new Promise(resolve => setTimeout(resolve, 500));
        wait.then(() => {
            flatListRef.current?.scrollToIndex({ index: info.index, animated: false });
        });
    };

    // --- LÓGICA DE GUARDADO ---
    // Usamos useCallback para que la función sea estable
    const onViewableItemsChanged = useCallback(({ viewableItems }) => {
        if (viewableItems.length > 0) {
            const visibleItem = viewableItems[0];
            // Log para ver si detecta el cambio
            // console.log("👀 Viendo capítulo:", visibleItem.index);

            if (visibleItem.index !== null && visibleItem.index !== undefined) {
                // Guardamos solo si cambió
                saveProgress(id, visibleItem.index);
            }
        }
    }, [id, saveProgress]); // Dependencias importantes

    // Configuración de visibilidad
    const viewabilityConfig = useRef({
        itemVisiblePercentThreshold: 50, // El capitulo debe verse al 50% para contar
        minimumViewTime: 500 // Debe quedarse 0.5s ahí para contar (evita guardar mientras scrolleas rápido)
    }).current;


    if (!bookData) return <View style={[styles.center, { backgroundColor: bgColors.main }]}><Text>No existe</Text></View>;

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

                    // Conectamos la lógica nueva
                    onLayout={onListLayout}
                    onScrollToIndexFailed={onScrollToIndexFailed}
                    onViewableItemsChanged={onViewableItemsChanged}
                    viewabilityConfig={viewabilityConfig}

                    renderItem={({ item: chapter }) => (
                        <View style={styles.chapterContainer}>
                            {chapter.title && (
                                <Text style={[styles.chapterTitle, { color: bgColors.title, fontFamily }]}>
                                    {chapter.title}
                                </Text>
                            )}
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

            {/* BARRA DE CONTROLES */}
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
    chapterTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 15,
        marginTop: 10,
        textAlign: 'center'
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