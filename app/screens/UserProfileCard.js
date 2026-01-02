import React, { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { COLORS } from '../resources/colors';
import { hp, wp } from '../resources/dimensions';
import { poppins } from '../resources/fonts';
import { useSelector } from 'react-redux';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';

const UserProfileCard = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();

  const profile = useSelector(state => state.Auth.profileDetails);
  const siteDetails = useSelector(state => state.Auth.siteDetails);

  const userName =
    `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() ||
    t('No name');

  const imageUri =
    profile?.driver_image
      ? `${siteDetails?.media_url}drivers/images/${profile.driver_image}`
      : null;

  const [imageLoading, setImageLoading] = useState(true);

  const handleEditProfilePic = useCallback(() => {
    navigation.navigate('UpdateProfilePic');
  }, []);

  const handleEditProfile = useCallback(() => {
    navigation.navigate('EditProfile');
  }, []);

  /* ---------------- Animations ---------------- */
  const imageScale = useRef(new Animated.Value(0.8)).current;
  const imageOpacity = useRef(new Animated.Value(0)).current;
  const nameTranslateY = useRef(new Animated.Value(10)).current;
  const nameOpacity = useRef(new Animated.Value(0)).current;
  const btnTranslateY = useRef(new Animated.Value(10)).current;
  const btnOpacity = useRef(new Animated.Value(0)).current;
  const arrowTranslateX = useRef(new Animated.Value(15)).current;
  const arrowOpacity = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      imageScale.setValue(0.8);
      imageOpacity.setValue(0);
      nameTranslateY.setValue(10);
      nameOpacity.setValue(0);
      btnTranslateY.setValue(10);
      btnOpacity.setValue(0);
      arrowTranslateX.setValue(15);
      arrowOpacity.setValue(0);

      Animated.stagger(200, [
        Animated.parallel([
          Animated.timing(imageOpacity, {
            toValue: 1,
            duration: 450,
            useNativeDriver: true,
          }),
          Animated.spring(imageScale, {
            toValue: 1,
            friction: 6,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(nameOpacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(nameTranslateY, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(btnOpacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(btnTranslateY, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(arrowOpacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(arrowTranslateX, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    }, [])
  );

  return (
    <Pressable onPress={handleEditProfile}>
      <View
        style={[
          styles.card,
          {
            backgroundColor: COLORS[theme].viewBackground,
            borderColor: COLORS[theme].accent ,
          },
        ]}
      >
        <TouchableOpacity
          onPress={handleEditProfilePic}
          activeOpacity={0.8}
          style={styles.imageContainer}
        >
          <View
            style={{
              padding: wp(1),
              borderRadius: wp(10),
              backgroundColor: COLORS[theme].accent + '20',
            }}
          >
            <Animated.View
              style={{
                opacity: imageOpacity,
                transform: [{ scale: imageScale }],
              }}
            >
              {imageUri ? (
                <>
                  {imageLoading && (
                    <View style={styles.loader}>
                      <ActivityIndicator color={COLORS[theme].accent} />
                    </View>
                  )}
                  <Animated.Image
                    source={{ uri: imageUri }}
                    onLoadEnd={() => setImageLoading(false)}
                    style={styles.profileImage}
                  />
                </>
              ) : (
                <View style={styles.placeholder}>
                  <MaterialCommunityIcon
                    name="account"
                    size={wp(10)}
                    color={COLORS[theme].textSecondary}
                  />
                </View>
              )}
            </Animated.View>
          </View>

          <MaterialCommunityIcon
            name="pencil-circle"
            size={wp(7)}
            style={styles.editIcon}
            color={COLORS[theme].accent}
          />
        </TouchableOpacity>

        {/* Info */}
        <View style={styles.infoContainer}>
          <Animated.Text
            numberOfLines={1}
            style={[
              poppins.semi_bold.h7,
              styles.userName,
              {
                color: COLORS[theme].textPrimary,
                opacity: nameOpacity,
                transform: [{ translateY: nameTranslateY }],
              },
            ]}
          >
            {userName}
          </Animated.Text>

          <Animated.View
            style={{
              opacity: btnOpacity,
              transform: [{ translateY: btnTranslateY }],
            }}
          >
            <TouchableOpacity
              onPress={handleEditProfile}
              activeOpacity={0.85}
              style={[
                styles.editButton,
                {
                  backgroundColor: COLORS[theme].accent + '15',
                  borderColor: COLORS[theme].accent,
                },
              ]}
            >
              <Text
                style={[
                  poppins.regular.h8,
                  { color: COLORS[theme].accent },
                ]}
              >
                {t('Edit Profile')}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Arrow */}
        <Animated.View
          style={{
            opacity: arrowOpacity,
            transform: [{ translateX: arrowTranslateX }],
          }}
        >
          <MaterialCommunityIcon
            name="chevron-right"
            size={wp(8)}
            color={COLORS[theme].textSecondary}
          />
        </Animated.View>
      </View>
    </Pressable>
  );
};

export default UserProfileCard;

/* ---------------- Styles ---------------- */
const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: wp(4),
    paddingHorizontal: wp(4),
    borderRadius: wp(4),
    borderWidth: 0.8,
    marginHorizontal: wp(4),
    marginVertical: wp(1.5),
    elevation: 5,
  },
  imageContainer: {
    position: 'relative',
    marginRight: wp(4),
  },
  profileImage: {
    width: wp(16),
    height: wp(16),
    borderRadius: wp(8),
  },
  placeholder: {
    width: wp(16),
    height: wp(16),
    borderRadius: wp(8),
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loader: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  editIcon: {
    position: 'absolute',
    bottom: -2,
    right: -2,
  },
  infoContainer: {
    flex: 1,
  },
  userName: {
    marginBottom: wp(1.5),
    textTransform: 'capitalize',
  },
  editButton: {
    paddingVertical: wp(1),
    paddingHorizontal: wp(3.5),
    borderRadius: wp(3),
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
});
