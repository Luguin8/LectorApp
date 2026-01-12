import React from 'react';
import { View, Text } from 'react-native';

// Simulamos las constantes de tamaño para que no de error
export const BannerAdSize = {
    BANNER: 'BANNER',
    MEDIUM_RECTANGLE: 'MEDIUM_RECTANGLE'
};

export default function AdBanner({ size }) {
    // Definimos tamaños según lo que pida la app
    const width = size === BannerAdSize.MEDIUM_RECTANGLE ? 300 : 320;
    const height = size === BannerAdSize.MEDIUM_RECTANGLE ? 250 : 50;
    const label = size === BannerAdSize.MEDIUM_RECTANGLE ? 'Anuncio Rectangular' : 'Banner Top';

    return (
        <View style={{
            width,
            height,
            backgroundColor: '#ccc',
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: '#999',
            borderStyle: 'dashed'
        }}>
            <Text style={{ color: '#555', fontWeight: 'bold' }}>{label}</Text>
            <Text style={{ color: '#555', fontSize: 10 }}>(Modo Web/Captura)</Text>
        </View>
    );
}