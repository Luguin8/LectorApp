import { StyleSheet, Text, View, FlatList, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
// Importamos los datos (asegurate de crear este archivo en el paso C)
import books from '../data/biblioteca.json';

export default function Home() {
    return (
        <View style={styles.container}>
            <FlatList
                data={books}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    // Por ahora es un botón simple, luego lo haremos tarjeta linda
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
    }
});