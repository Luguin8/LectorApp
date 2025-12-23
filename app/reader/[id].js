import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';

// Importamos nuestros datos y el cargador
import books from '../../data/biblioteca.json';
import { bookFiles } from '../../utils/bookLoader';

export default function ReaderScreen() {
    const { id } = useLocalSearchParams(); // Capturamos el ID de la URL (ej: "libro1")
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);

    // Buscamos la metadata del libro en el JSON
    const bookData = books.find((b) => b.id === id);

    useEffect(() => {
        loadBookContent();
    }, [id]);

    const loadBookContent = async () => {
        try {
            // 1. Obtenemos el archivo desde nuestro mapa usando el ID
            const bookFile = bookFiles[id];

            if (!bookFile) {
                setContent("Error: Libro no encontrado en el sistema de archivos.");
                setLoading(false);
                return;
            }

            // 2. Expo necesita "descargar" el asset a una carpeta temporal para leerlo
            const asset = Asset.fromModule(bookFile);
            await asset.downloadAsync();

            // 3. Leemos el contenido como texto
            const text = await FileSystem.readAsStringAsync(asset.localUri || asset.uri);
            setContent(text);

        } catch (error) {
            console.error("Error leyendo libro:", error);
            setContent("Hubo un error al cargar el libro.");
        } finally {
            setLoading(false);
        }
    };

    if (!bookData) return <View style={styles.center}><Text>Libro no existe</Text></View>;

    return (
        <View style={styles.container}>
            {/* Configuramos el título de la barra superior dinámicamente */}
            <Stack.Screen options={{ title: bookData.title }} />

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#f4511e" />
                    <Text style={{ marginTop: 10 }}>Cargando libro...</Text>
                </View>
            ) : (
                <ScrollView style={styles.scrollView} contentContainerStyle={styles.textContainer}>
                    <Text style={styles.paragraph}>
                        {content}
                    </Text>
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff', // Fondo blanco (luego será dinámico para modo noche)
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollView: {
        flex: 1,
    },
    textContainer: {
        padding: 20,
        paddingBottom: 50,
    },
    paragraph: {
        fontSize: 18,
        lineHeight: 28,
        color: '#333',
        textAlign: 'left',
    },
});