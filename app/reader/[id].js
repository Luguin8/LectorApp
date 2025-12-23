import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';

import books from '../../data/biblioteca.json';
import { bookFiles } from '../../utils/bookLoader';

export default function ReaderScreen() {
    const { id } = useLocalSearchParams();
    const [chapters, setChapters] = useState([]); // Ahora guardamos un array de capítulos
    const [loading, setLoading] = useState(true);

    const bookData = books.find((b) => b.id === id);

    useEffect(() => {
        loadBookContent();
    }, [id]);

    const loadBookContent = async () => {
        try {
            const bookFile = bookFiles[id];
            if (!bookFile) return;

            const asset = Asset.fromModule(bookFile);
            await asset.downloadAsync();
            const text = await FileSystem.readAsStringAsync(asset.localUri || asset.uri);

            // TRUCO SENIOR:
            // Como el archivo original del cliente puede tener saltos de línea raros (\n)
            // o formato sucio, parseamos el JSON y limpiamos el texto al vuelo.
            const jsonContent = JSON.parse(text);
            setChapters(jsonContent);

        } catch (error) {
            console.error("Error:", error);
            alert("Error al procesar el formato del libro.");
        } finally {
            setLoading(false);
        }
    };

    if (!bookData) return <View style={styles.center}><Text>Libro no existe</Text></View>;

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ title: bookData.title }} />

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#f4511e" />
                </View>
            ) : (
                <ScrollView style={styles.scrollView}>
                    <View style={styles.textContainer}>
                        {/* Renderizamos cada capítulo uno abajo del otro (Scroll Infinito) */}
                        {chapters.map((chapter, index) => (
                            <View key={index} style={styles.chapterContainer}>
                                {/* Título del Capítulo (si existe en el JSON) */}
                                {chapter.title && (
                                    <Text style={styles.chapterTitle}>{chapter.title}</Text>
                                )}

                                {/* Contenido del Capítulo */}
                                <Text style={styles.paragraph}>
                                    {/* Reemplazamos los \\n literales por saltos de línea reales */}
                                    {chapter.content ? chapter.content.replace(/\\n/g, '\n\n') : ''}
                                </Text>

                                {/* Separador visual entre capítulos */}
                                <View style={styles.separator} />
                            </View>
                        ))}
                    </View>
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scrollView: { flex: 1 },
    textContainer: { padding: 20, paddingBottom: 50 },

    chapterContainer: { marginBottom: 30 },

    chapterTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#f4511e',
        marginBottom: 15,
        marginTop: 10,
        textAlign: 'center'
    },

    paragraph: {
        fontSize: 18,
        lineHeight: 30, // Un poco más de aire para leer mejor
        color: '#333',
        textAlign: 'left',
    },

    separator: {
        height: 1,
        backgroundColor: '#eee',
        marginVertical: 30,
        width: '80%',
        alignSelf: 'center'
    }
});