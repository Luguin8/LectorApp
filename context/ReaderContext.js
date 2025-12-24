import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts, Merriweather_400Regular, Merriweather_700Bold } from '@expo-google-fonts/merriweather';

const defaultSettings = {
    theme: 'day',
    fontSize: 18,
    fontFamily: 'System',
};

export const ReaderContext = createContext();

export const ReaderProvider = ({ children }) => {
    const [theme, setTheme] = useState(defaultSettings.theme);
    const [fontSize, setFontSize] = useState(defaultSettings.fontSize);

    // CAMBIO: Iniciamos como objeto vacío para soportar múltiples libros
    const [bookmarks, setBookmarks] = useState({});

    const [lastChapter, setLastChapter] = useState(null);
    const [isReady, setIsReady] = useState(false);

    let [fontsLoaded] = useFonts({
        Merriweather_400Regular,
        Merriweather_700Bold,
    });

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

            if (savedBookmarks) {
                const parsed = JSON.parse(savedBookmarks);
                // Validación extra: Si es un array (formato viejo), lo reseteamos a objeto
                if (Array.isArray(parsed)) {
                    setBookmarks({});
                } else {
                    setBookmarks(parsed);
                }
            }

            if (savedProgress) setLastChapter(JSON.parse(savedProgress));

            setIsReady(true);
        } catch (e) {
            console.error("Error cargando configuración:", e);
        }
    };

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

    // CAMBIO IMPORTANTE: Recibimos bookId para guardar independientemente
    const toggleBookmark = async (bookId, chapterIndex) => {
        const currentBookBookmarks = bookmarks[bookId] || [];
        let newBookBookmarks;

        if (currentBookBookmarks.includes(chapterIndex)) {
            // Si ya existe, lo quitamos
            newBookBookmarks = currentBookBookmarks.filter(id => id !== chapterIndex);
        } else {
            // Si no existe, lo agregamos
            newBookBookmarks = [...currentBookBookmarks, chapterIndex];
        }

        // Actualizamos el objeto global de bookmarks
        const newBookmarks = { ...bookmarks, [bookId]: newBookBookmarks };

        setBookmarks(newBookmarks);
        await AsyncStorage.setItem('bookmarks', JSON.stringify(newBookmarks));
    };

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

export const useReader = () => useContext(ReaderContext);