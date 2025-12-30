import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

const ReaderContext = createContext();

const FONT_SIZE_KEY = 'florecillas_font_size';
const THEME_KEY = 'florecillas_theme';
const LAST_CHAPTER_KEY = 'florecillas_last_chapter';
const BOOKMARKS_KEY = 'florecillas_bookmarks';
const TEXT_ALIGN_KEY = 'florecillas_text_align'; // NUEVA CLAVE

export const ReaderProvider = ({ children }) => {
    const [theme, setTheme] = useState('day');
    const [fontSize, setFontSize] = useState(18);
    const [textAlign, setTextAlign] = useState('justify'); // NUEVO ESTADO (Default: Justificado)
    const [fontFamily, setFontFamily] = useState('System');
    const [isReady, setIsReady] = useState(false);
    const [lastChapter, setLastChapter] = useState(null);
    const [bookmarks, setBookmarks] = useState({});

    const [fontsLoaded] = useFonts({
        // Aquí podrías cargar fuentes custom si tuvieras
    });

    useEffect(() => {
        loadSettings();
    }, [fontsLoaded]);

    const loadSettings = async () => {
        try {
            const savedTheme = await AsyncStorage.getItem(THEME_KEY);
            const savedFontSize = await AsyncStorage.getItem(FONT_SIZE_KEY);
            const savedChapter = await AsyncStorage.getItem(LAST_CHAPTER_KEY);
            const savedBookmarks = await AsyncStorage.getItem(BOOKMARKS_KEY);
            const savedTextAlign = await AsyncStorage.getItem(TEXT_ALIGN_KEY); // Cargar alineación

            if (savedTheme) setTheme(savedTheme);
            if (savedFontSize) setFontSize(parseFloat(savedFontSize));
            if (savedChapter) setLastChapter(JSON.parse(savedChapter));
            if (savedBookmarks) setBookmarks(JSON.parse(savedBookmarks));
            if (savedTextAlign) setTextAlign(savedTextAlign); // Setear alineación

        } catch (e) {
            console.error("Error cargando settings", e);
        } finally {
            setIsReady(true);
            await SplashScreen.hideAsync();
        }
    };

    const toggleTheme = async () => {
        const newTheme = theme === 'day' ? 'night' : 'day';
        setTheme(newTheme);
        await AsyncStorage.setItem(THEME_KEY, newTheme);
    };

    // NUEVA FUNCIÓN: Alternar alineación
    const toggleTextAlign = async () => {
        const newAlign = textAlign === 'justify' ? 'left' : 'justify';
        setTextAlign(newAlign);
        await AsyncStorage.setItem(TEXT_ALIGN_KEY, newAlign);
    };

    const changeFontSize = async (action) => {
        let newSize = fontSize;
        if (action === 'increase') newSize += 2;
        if (action === 'decrease') newSize -= 2;

        if (newSize < 12) newSize = 12;
        if (newSize > 34) newSize = 34;

        setFontSize(newSize);
        await AsyncStorage.setItem(FONT_SIZE_KEY, newSize.toString());
    };

    const saveProgress = async (bookId, chapterIndex) => {
        const data = { bookId, chapterIndex };
        setLastChapter(data);
        await AsyncStorage.setItem(LAST_CHAPTER_KEY, JSON.stringify(data));
    };

    const toggleBookmark = async (bookId, chapterIndex) => {
        const newBookmarks = { ...bookmarks };
        if (!newBookmarks[bookId]) newBookmarks[bookId] = [];

        if (newBookmarks[bookId].includes(chapterIndex)) {
            newBookmarks[bookId] = newBookmarks[bookId].filter(i => i !== chapterIndex);
        } else {
            newBookmarks[bookId].push(chapterIndex);
        }

        setBookmarks(newBookmarks);
        await AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify(newBookmarks));
    };

    return (
        <ReaderContext.Provider value={{
            theme,
            fontSize,
            fontFamily,
            textAlign,      // Exportamos
            toggleTextAlign,// Exportamos
            isReady,
            lastChapter,
            bookmarks,
            toggleTheme,
            changeFontSize,
            saveProgress,
            toggleBookmark
        }}>
            {children}
        </ReaderContext.Provider>
    );
};

export const useReader = () => useContext(ReaderContext);