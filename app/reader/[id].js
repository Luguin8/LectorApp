import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, TouchableOpacity, FlatList } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
// Importamos esto para saber cuánto espacio dejar abajo (evita tapar botones del cel)
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useReader } from '../../context/ReaderContext';
import books from '../../data/biblioteca.json';
import { bookFiles } from '../../utils/bookLoader';

export default function ReaderScreen() {
    const { id } = useLocalSearchParams();
    // Hook para detectar los márgenes seguros del dispositivo
    const insets = useSafeAreaInsets();

    const { theme, fontSize, fontFamily, toggleTheme, changeFontSize, isReady } = useReader();

    const [chapters, setChapters] = useState([]);
    const [loading, setLoading] = useState(true);

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
            alert("Hubo un error al mostrar el libro.");
        } finally {
            setLoading(false);
        }
    };

    if (!bookData) return <View style={[styles.center, { backgroundColor: bgColors.main }]}><Text style={{ color: bgColors.text }}>Libro no existe</Text></View>;

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
                // CAMBIO 1: Usamos FlatList en lugar de ScrollView para eliminar el LAG
                <FlatList
                    data={chapters}
                    keyExtractor={(item, index) => index.toString()}
                    contentContainerStyle={{
                        padding: 20,
                        // Damos espacio extra abajo para que el texto no quede tapado por la barra
                        paddingBottom: 150
                    }}
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
            {/* CAMBIO 2: Padding dinámico basado en 'insets.bottom' */}
            <View style={[
                styles.controlsBar,
                {
                    backgroundColor: bgColors.controls,
                    borderTopColor: isNight ? '#444' : '#ccc',
                    paddingBottom: Math.max(insets.bottom, 20) // Mínimo 20px, o más si el cel lo requiere
                }
            ]}>

                <TouchableOpacity onPress={() => changeFontSize('decrease')} style={styles.controlBtn}>
                    <Text style={[styles.btnText, { color: bgColors.controlText }]}>A-</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={toggleTheme} style={[styles.controlBtn, { flex: 2 }]}>
                    <Text style={[styles.btnText, { color: bgColors.controlText }]}>
                        {isNight ? 'Modo Día ☀️' : 'Modo Noche 🌙'}
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
    // Eliminamos styles.scrollView y styles.textContainer porque FlatList los maneja diferente
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
        // Eliminamos paddingBottom fijo aquí, lo controlamos inline arriba
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