import React, { useState } from 'react';
import { View } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';

export { BannerAdSize };

export default function AdBanner({ unitId, size }) {
    const [adFailed, setAdFailed] = useState(false);

    if (adFailed) {
        // Si el ad falla, no mostramos nada (no rompe el layout)
        return null;
    }

    return (
        <View>
            <BannerAd
                unitId={unitId}
                size={size || BannerAdSize.BANNER}
                requestOptions={{
                    requestNonPersonalizedAdsOnly: false,
                }}
                onAdFailedToLoad={() => setAdFailed(true)}
            />
        </View>
    );
}