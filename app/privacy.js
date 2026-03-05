import { ScrollView, Text, View, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { useReader } from '../context/ReaderContext';

export default function PrivacyScreen() {
    const { theme } = useReader();
    const isNight = theme === 'night';

    const colors = {
        bg: isNight ? '#1a1a1a' : '#fff',
        text: isNight ? '#d1d1d1' : '#333',
        heading: isNight ? '#81c784' : '#691a35',
        sectionBg: isNight ? '#222' : '#f9f9f9',
        border: isNight ? '#444' : '#eee',
    };

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: colors.bg }]}
            contentContainerStyle={styles.content}
        >
            <Text style={[styles.title, { color: colors.heading }]}>
                Política de Privacidad
            </Text>
            <Text style={[styles.subtitle, { color: colors.text }]}>
                Florecillas de San Francisco — Última actualización: marzo 2025
            </Text>

            <Section title="1. Información general" colors={colors}>
                Esta aplicación («Florecillas de San Francisco») es una app de lectura gratuita.
                No recopilamos ni almacenamos información personal identificable de nuestros usuarios.
            </Section>

            <Section title="2. Publicidad" colors={colors}>
                La app muestra publicidad a través de Google AdMob para sostenerse económicamente.
                Google puede utilizar identificadores de dispositivo para mostrar anuncios relevantes.
                Podés optar por no recibir publicidad personalizada desde los ajustes de tu dispositivo
                en: Ajustes → Google → Anuncios → Inhabilitar la personalización de anuncios.
            </Section>

            <Section title="3. Datos que recopila Google AdMob" colors={colors}>
                Google AdMob puede recopilar los siguientes datos con fines publicitarios:{'\n\n'}
                • Identificadores de publicidad del dispositivo{'\n'}
                • Datos de uso e interacción con anuncios{'\n'}
                • Dirección IP (aproximada){'\n'}
                • Información del dispositivo (modelo, sistema operativo){'\n\n'}
                Para más información, consultá la Política de Privacidad de Google:{' '}
                <Text
                    style={{ color: colors.heading, textDecorationLine: 'underline' }}
                    onPress={() => Linking.openURL('https://policies.google.com/privacy')}
                >
                    policies.google.com/privacy
                </Text>
            </Section>

            <Section title="4. Datos almacenados localmente" colors={colors}>
                La app guarda en tu dispositivo (exclusivamente) las siguientes preferencias
                de lectura:{'\n\n'}
                • Tamaño de fuente elegido{'\n'}
                • Tema (día/noche){'\n'}
                • Alineación del texto{'\n'}
                • Último capítulo leído (progreso){'\n'}
                • Marcadores de capítulos (favoritos){'\n\n'}
                Estos datos permanecen en tu dispositivo y no se envían a ningún servidor.
                Podés eliminarlos borrando la caché de la aplicación.
            </Section>

            <Section title="5. Permisos de la aplicación" colors={colors}>
                La app requiere únicamente:{'\n\n'}
                • INTERNET: Para cargar los anuncios de AdMob{'\n'}
                • ACCESS_NETWORK_STATE: Para verificar la conectividad antes de cargar anuncios
            </Section>

            <Section title="6. Menores de edad" colors={colors}>
                Esta aplicación no está dirigida a menores de 13 años ni recopila
                intencionalmente datos de menores.
            </Section>

            <Section title="7. Cambios en esta política" colors={colors}>
                Podemos actualizar esta política de privacidad ocasionalmente. Cualquier cambio
                significativo será notificado mediante una actualización de la aplicación.
            </Section>

            <Section title="8. Contacto" colors={colors}>
                Si tenés preguntas sobre esta política de privacidad, podés contactarnos
                en: florecillas.app@gmail.com
            </Section>
        </ScrollView>
    );
}

function Section({ title, children, colors }) {
    return (
        <View style={[styles.section, { backgroundColor: colors.sectionBg, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.heading }]}>{title}</Text>
            <Text style={[styles.body, { color: colors.text }]}>{children}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        marginBottom: 6,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 13,
        textAlign: 'center',
        marginBottom: 24,
        opacity: 0.7,
    },
    section: {
        borderRadius: 10,
        borderWidth: 1,
        padding: 16,
        marginBottom: 14,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    body: {
        fontSize: 14,
        lineHeight: 22,
    },
});
