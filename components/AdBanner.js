import React from 'react';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';

// Exportamos las constantes de tamaño para poder usarlas fuera
export { BannerAdSize };

export default function AdBanner({ unitId, size }) {
    return (
        <BannerAd
            unitId={unitId}
            size={size || BannerAdSize.BANNER}
            requestOptions={{ requestNonPersonalizedAdsOnly: true }}
        />
    );
}