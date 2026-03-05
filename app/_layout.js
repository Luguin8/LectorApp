import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { ReaderProvider } from '../context/ReaderContext';

// Prevenir que el splash se oculte automáticamente
SplashScreen.preventAutoHideAsync();

export default function Layout() {
    return (
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
                <Stack.Screen name="privacy" options={{ title: 'Política de Privacidad' }} />
            </Stack>
        </ReaderProvider>
    );
}