import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';

// YA NO NECESITAMOS NI ASSET NI FILESYSTEM
// import { Asset } from 'expo-asset';
// import * as FileSystem from 'expo-file-system/legacy';

import books from '../../data/biblioteca.json';
import { bookFiles } from '../../utils/bookLoader';

export default function ReaderScreen() {
    const { id } = useLocalSearchParams();
    const [chapters, setChapters] = useState([]);
    const [loading, setLoading] = useState(true);

    const bookData = books.find((b) => b.id === id);

    useEffect(() => {
        loadBookContent();
    }, [id]);

    const loadBookContent = () => { // Ya no necesita ser async
        try {
            const bookContent = bookFiles[id]; // Esto YA ES el array de capítulos

            if (!bookContent) {
                alert("Error: No se encontró el contenido del libro.");
                return;
            }

            // Como ya es un objeto JSON, lo guardamos directo
            setChapters(bookContent);

        } catch (error) {
            console.error("Error cargando libro:", error);
            alert("Hubo un error al mostrar el libro.");
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
                        {chapters.map((chapter, index) => (
                            <View key={index} style={styles.chapterContainer}>
                                {chapter.title && (
                                    <Text style={styles.chapterTitle}>{chapter.title}</Text>
                                )}

                                <Text style={styles.paragraph}>
                                    {/* Manejo de saltos de línea por si acaso */}
                                    {chapter.content ? chapter.content.replace(/\\n/g, '\n\n') : ''}
                                </Text>

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
        lineHeight: 30,
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