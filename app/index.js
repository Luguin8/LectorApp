import { StyleSheet, Text, View, FlatList, TouchableOpacity, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useReader } from '../context/ReaderContext';
import books from '../data/biblioteca.json';

const PRIMARY = '#691a35';

export default function Home() {
    const { width } = useWindowDimensions();
    const { theme } = useReader();
    const isNight = theme === 'night';

    const colors = {
        bg: isNight ? '#1a1a1a' : '#f5f0eb',
        text: isNight ? '#d1d1d1' : '#2c1a11',
        subtext: isNight ? '#888' : '#7a6652',
        card: isNight ? '#2a2a2a' : '#fff',
        cardBorder: isNight ? '#3a3a3a' : '#e8ddd5',
        primary: isNight ? '#81c784' : PRIMARY,
    };

    // En landscape o tablet (> 600px), usamos 2 columnas
    const numColumns = width > 600 ? 2 : 1;

    return (
        <View style={[styles.container, { backgroundColor: colors.bg }]}>
            <FlatList
                key={numColumns} // necesario para re-render al cambiar numColumns
                data={books}
                numColumns={numColumns}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        onPress={() => router.push(`/reader/${item.id}`)}
                        style={StyleSheet.flatten([
                            styles.bookItem,
                            {
                                flex: numColumns > 1 ? 1 : undefined,
                                backgroundColor: colors.card,
                                borderColor: colors.cardBorder,
                                margin: numColumns > 1 ? 8 : 0,
                                marginBottom: numColumns > 1 ? 8 : 12,
                            }
                        ])}
                        activeOpacity={0.75}
                    >
                        <View style={[styles.coverPlaceholder, { backgroundColor: item.coverColor }]}>
                            <Ionicons name="book" size={22} color="rgba(255,255,255,0.8)" />
                        </View>
                        <View style={styles.bookInfo}>
                            <Text style={[styles.bookTitle, { color: colors.text }]} numberOfLines={2}>
                                {item.title}
                            </Text>
                            <Text style={[styles.bookAuthor, { color: colors.subtext }]}>
                                {item.author}
                            </Text>
                            <View style={[styles.readBadge, { borderColor: colors.primary }]}>
                                <Text style={[styles.readBadgeText, { color: colors.primary }]}>Leer libro</Text>
                                <Ionicons name="arrow-forward" size={12} color={colors.primary} style={{ marginLeft: 4 }} />
                            </View>
                        </View>
                    </TouchableOpacity>
                )}
                ListHeaderComponent={() => (
                    <View style={styles.headerContainer}>
                        <Text style={[styles.headerTitle, { color: colors.primary }]}>Biblioteca</Text>
                        <Text style={[styles.headerSub, { color: colors.subtext }]}>Textos espirituales de dominio público</Text>
                    </View>
                )}
                ListFooterComponent={() => (
                    <View style={styles.footerContainer}>
                        <Text style={[styles.footerText, { color: colors.subtext }]}>
                            Traducción libre de derechos de autor
                        </Text>
                        <TouchableOpacity
                            onPress={() => router.push('/privacy')}
                            style={styles.privacyLink}
                        >
                            <Ionicons name="shield-checkmark-outline" size={14} color={colors.subtext} />
                            <Text style={[styles.privacyText, { color: colors.subtext }]}>
                                Política de Privacidad
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    listContent: {
        padding: 16,
        paddingBottom: 40,
    },
    headerContainer: {
        paddingBottom: 20,
        paddingTop: 8,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    headerSub: {
        fontSize: 14,
    },
    bookItem: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 14,
        alignItems: 'center',
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 3,
    },
    coverPlaceholder: {
        width: 52,
        height: 72,
        borderRadius: 8,
        marginRight: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    bookInfo: {
        flex: 1,
    },
    bookTitle: {
        fontSize: 17,
        fontWeight: '700',
        marginBottom: 4,
        lineHeight: 22,
    },
    bookAuthor: {
        fontSize: 13,
        marginBottom: 10,
    },
    readBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 4,
        alignSelf: 'flex-start',
    },
    readBadgeText: {
        fontSize: 12,
        fontWeight: '600',
    },
    footerContainer: {
        paddingTop: 24,
        alignItems: 'center',
        gap: 10,
    },
    footerText: {
        fontSize: 11,
        textAlign: 'center',
    },
    privacyLink: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingVertical: 6,
    },
    privacyText: {
        fontSize: 12,
        textDecorationLine: 'underline',
    },
});