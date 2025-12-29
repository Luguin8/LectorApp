import { Stack } from 'expo-router';
// 1. Importamos el Provider
import { ReaderProvider } from '../context/ReaderContext';

export default function Layout() {
    return (
        // 2. Envolvemos la navegación
        <ReaderProvider>
            <Stack
                screenOptions={{
                    headerStyle: {
                        backgroundColor: '#691a35',
                    },
                    headerTintColor: '#fff',
                    headerTitleStyle: {
                        fontWeight: 'bold',
                    },
                }}
            >
                <Stack.Screen name="index" options={{ title: 'Biblioteca' }} />
                {/* Aquí la pantalla del lector recibirá configuración extra después */}
            </Stack>
        </ReaderProvider>
    );
}