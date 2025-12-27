import { StyleSheet, Text, View, FlatList, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
// Importamos los datos
import books from '../data/biblioteca.json';

export default function Home() {
    return (
        <View style={styles.container}>
            <FlatList
                data={books}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <Link href={`/reader/${item.id}`} asChild>
                        <TouchableOpacity style={styles.bookItem}>
                            <View style={[styles.coverPlaceholder, { backgroundColor: item.coverColor }]} />
                            <View>
                                <Text style={styles.bookTitle}>{item.title}</Text>
                                <Text style={styles.bookAuthor}>{item.author}</Text>
                            </View>
                        </TouchableOpacity>
                    </Link>
                )}
                // NUEVO: Footer con el aviso de derechos
                ListFooterComponent={() => (
                    <View style={styles.footerContainer}>
                        <Text style={styles.footerText}>
                            Traducción libre de derechos de autor
                        </Text>
                    </View>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 20,
    },
    bookItem: {
        flexDirection: 'row',
        padding: 15,
        marginBottom: 10,
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#eee'
    },
    coverPlaceholder: {
        width: 40,
        height: 60,
        borderRadius: 4,
        marginRight: 15,
    },
    bookTitle: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    bookAuthor: {
        color: '#666',
    },
    footerContainer: {
        padding: 20,
        alignItems: 'center',
        marginTop: 10
    },
    footerText: {
        color: '#888',
        fontSize: 12,
        textAlign: 'center'
    }
});