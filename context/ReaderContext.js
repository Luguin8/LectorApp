import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SplashScreen from 'expo-splash-screen';

const ReaderContext = createContext();

const FONT_SIZE_KEY = 'florecillas_font_size';
const THEME_KEY = 'florecillas_theme';
const LAST_CHAPTER_KEY = 'florecillas_last_chapter';
const BOOKMARKS_KEY = 'florecillas_bookmarks';
const TEXT_ALIGN_KEY = 'florecillas_text_align';

export const ReaderProvider = ({ children }) => {
    const [theme, setTheme] = useState('day');
    const [fontSize, setFontSize] = useState(18);
    const [textAlign, setTextAlign] = useState('left');
    const [isReady, setIsReady] = useState(false);
    const [lastChapter, setLastChapter] = useState(null);
    const [bookmarks, setBookmarks] = useState({});

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const [
                savedTheme,
                savedFontSize,
                savedChapter,
                savedBookmarks,
                savedTextAlign
            ] = await Promise.all([
                AsyncStorage.getItem(THEME_KEY),
                AsyncStorage.getItem(FONT_SIZE_KEY),
                AsyncStorage.getItem(LAST_CHAPTER_KEY),
                AsyncStorage.getItem(BOOKMARKS_KEY),
                AsyncStorage.getItem(TEXT_ALIGN_KEY),
            ]);

            if (savedTheme) setTheme(savedTheme);
            if (savedFontSize) setFontSize(parseFloat(savedFontSize));
            if (savedChapter) {
                try { setLastChapter(JSON.parse(savedChapter)); } catch (_) { }
            }
            if (savedBookmarks) {
                try { setBookmarks(JSON.parse(savedBookmarks)); } catch (_) { }
            }
            if (savedTextAlign) setTextAlign(savedTextAlign);
        } catch (e) {
            // Si no se pueden cargar los settings, continuamos con los defaults
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

    const toggleTextAlign = async () => {
        const newAlign = textAlign === 'justify' ? 'left' : 'justify';
        setTextAlign(newAlign);
        await AsyncStorage.setItem(TEXT_ALIGN_KEY, newAlign);
    };

    const changeFontSize = async (action) => {
        setFontSize(prev => {
            let newSize = prev;
            if (action === 'increase') newSize = Math.min(prev + 2, 34);
            if (action === 'decrease') newSize = Math.max(prev - 2, 12);
            AsyncStorage.setItem(FONT_SIZE_KEY, newSize.toString());
            return newSize;
        });
    };

    const saveProgress = async (bookId, chapterIndex) => {
        const data = { bookId, chapterIndex };
        setLastChapter(data);
        await AsyncStorage.setItem(LAST_CHAPTER_KEY, JSON.stringify(data));
    };

    const toggleBookmark = async (bookId, chapterIndex) => {
        setBookmarks(prev => {
            const updated = { ...prev };
            if (!updated[bookId]) updated[bookId] = [];
            if (updated[bookId].includes(chapterIndex)) {
                updated[bookId] = updated[bookId].filter(i => i !== chapterIndex);
            } else {
                updated[bookId] = [...updated[bookId], chapterIndex];
            }
            AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify(updated));
            return updated;
        });
    };

    return (
        <ReaderContext.Provider value={{
            theme,
            fontSize,
            textAlign,
            toggleTextAlign,
            isReady,
            lastChapter,
            bookmarks,
            toggleTheme,
            changeFontSize,
            saveProgress,
            toggleBookmark,
        }}>
            {children}
        </ReaderContext.Provider>
    );
};

export const useReader = () => useContext(ReaderContext);