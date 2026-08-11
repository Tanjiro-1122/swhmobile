import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { colors } from '../../theme/nativeTheme';

const salImage = require('../../../assets/sal.jpeg');

export default function SalAvatar({ size = 72, crop = 'portrait', glow = true, style }) {
  const imageSize = crop === 'eyes' ? size * 2.4 : size * 1.45;
  const imageTop = crop === 'eyes' ? -size * 0.72 : -size * 0.16;

  return (
    <View
      style={[
        styles.shell,
        {
          borderRadius: size / 2,
          height: size,
          width: size,
        },
        glow && styles.glow,
        style,
      ]}
    >
      <Image
        source={salImage}
        resizeMode="cover"
        style={[
          styles.image,
          {
            height: imageSize,
            top: imageTop,
            width: imageSize,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.cyan,
    borderWidth: 1,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  glow: {
    shadowColor: colors.cyan,
    shadowOpacity: 0.45,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
  },
  image: {
    position: 'absolute',
  },
});

