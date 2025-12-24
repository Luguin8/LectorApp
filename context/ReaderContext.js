import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts, Merriweather_400Regular, Merriweather_700Bold } from '@expo-google-fonts/merriweather';

// Definimos los valores por defecto
const defaultSettings = {
    theme: 'day', // 'day' | 'night'
    fontSize: 18,
    fontFamily: 'System', // Cambiará a 'Merriweather' cuando cargue
};

export const ReaderContext = createContext();

export const ReaderProvider = ({ children }) => {
    const [theme, setTheme] = useState(defaultSettings.theme);
    const [fontSize, setFontSize] = useState(defaultSettings.fontSize);
    const [bookmarks, setBookmarks] = useState([]); // Array de IDs de capítulos marcados
    const [lastChapter, setLastChapter] = useState(null); // { bookId: 'libro1', chapterIndex: 0 }
    const [isReady, setIsReady] = useState(false);

    // Cargamos la fuente de Google
    let [fontsLoaded] = useFonts({
        Merriweather_400Regular,
        Merriweather_700Bold,
    });

    // AL INICIAR: Recuperamos todo de la memoria del celular
    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const savedTheme = await AsyncStorage.getItem('theme');
            const savedSize = await AsyncStorage.getItem('fontSize');
            const savedBookmarks = await AsyncStorage.getItem('bookmarks');
            const savedProgress = await AsyncStorage.getItem('lastProgress');

            if (savedTheme) setTheme(savedTheme);
            if (savedSize) setFontSize(parseInt(savedSize));
            if (savedBookmarks) setBookmarks(JSON.parse(savedBookmarks));
            if (savedProgress) setLastChapter(JSON.parse(savedProgress));

            setIsReady(true);
        } catch (e) {
            console.error("Error cargando configuración:", e);
        }
    };

    // FUNCIONES PARA USAR EN LA APP

    const toggleTheme = async () => {
        const newTheme = theme === 'day' ? 'night' : 'day';
        setTheme(newTheme);
        await AsyncStorage.setItem('theme', newTheme);
    };

    const changeFontSize = async (action) => {
        let newSize = fontSize;
        if (action === 'increase' && fontSize < 30) newSize += 2;
        if (action === 'decrease' && fontSize > 12) newSize -= 2;

        setFontSize(newSize);
        await AsyncStorage.setItem('fontSize', newSize.toString());
    };

    const saveProgress = async (bookId, chapterIndex) => {
        const progress = { bookId, chapterIndex };
        setLastChapter(progress);
        await AsyncStorage.setItem('lastProgress', JSON.stringify(progress));
    };

    const toggleBookmark = async (chapterIndex) => {
        let newBookmarks;
        if (bookmarks.includes(chapterIndex)) {
            newBookmarks = bookmarks.filter(b => b !== chapterIndex);
        } else {
            newBookmarks = [...bookmarks, chapterIndex];
        }
        setBookmarks(newBookmarks);
        await AsyncStorage.setItem('bookmarks', JSON.stringify(newBookmarks));
    };

    // Exportamos todo para que lo usen los componentes
    return (
        <ReaderContext.Provider value={{
            theme,
            fontSize,
            fontFamily: fontsLoaded ? 'Merriweather_400Regular' : 'System',
            isReady: isReady && fontsLoaded,
            toggleTheme,
            changeFontSize,
            saveProgress,
            lastChapter,
            bookmarks,
            toggleBookmark
        }}>
            {children}
        </ReaderContext.Provider>
    );
};

// Hook personalizado para no importar useContext en todos lados
export const useReader = () => useContext(ReaderContext);