import React, { useState, useRef, useEffect } from 'react';
import {
  Text, StyleSheet, ScrollView, TouchableOpacity,
  View, Linking, Alert, TextInput, Image,
  Animated
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import HeaderBar from '../components/header';
import { COLORS } from '../resources/colors';
import { hp, wp } from '../resources/dimensions';
import { poppins } from '../resources/fonts';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import * as ImagePicker from 'react-native-image-picker';

const DeliveryPartnerSupport = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  // Support Info
  const name = 'Sri Maruthi Enterprises';
  const phone = '9025003231'; // WhatsApp number
  const mailId = 'admin@bringesse.com';

  const handleWhatsApp = () => {
    let url = `https://wa.me/${phone}`;
    Linking.openURL(url).catch(() => Alert.alert('Error', 'Cannot open WhatsApp'));
  };

  const handleEmail = () => Linking.openURL(`mailto:${mailId}`);

  // Ticket Categories for Delivery Partners
  const categories = {
    Delivery: ['Late Pickup', 'Incorrect Delivery', 'Damaged Package'],
    Payment: ['Pending Incentives', 'Payment Not Credited', 'Incorrect Deduction'],
    App: ['Login Issue', 'App Crash', 'Navigation Error'],
    Others: ['Feedback', 'Complaint', 'General Inquiry']
  };

  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSub, setSelectedSub] = useState('');
  const [showCategoryList, setShowCategoryList] = useState(false);
  const [showSubList, setShowSubList] = useState(false);
  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState(null);

  // Animated Raise Button
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (selectedCategory && selectedSub && description) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true
      }).start();
    }
  }, [selectedCategory, selectedSub, description]);

  const raiseTicket = () => {
    if (!selectedCategory || !selectedSub || !description) {
      Alert.alert('Error', 'Please fill all fields.');
      return;
    }
    Alert.alert(
      'Ticket Raised',
      `Ticket Type: ${selectedCategory}\nIssue Type: ${selectedSub}\nDescription: ${description}\nImage: ${imageUri ? 'Attached' : 'No Image'}`
    );
    setSelectedCategory('');
    setSelectedSub('');
    setDescription('');
    setImageUri(null);
  };

  const selectImage = () => {
    ImagePicker.launchImageLibrary(
      { mediaType: 'photo', quality: 0.7 },
      (response) => {
        if (response.didCancel) return;
        if (response.errorCode) {
          Alert.alert('Error', response.errorMessage);
          return;
        }
        setImageUri(response.assets[0].uri);
      }
    );
  };

  const removeImage = () => setImageUri(null);

  return (
    <GestureHandlerRootView
      style={{ flex: 1, backgroundColor: COLORS[theme].background }}
    >
      <HeaderBar title={t('Partner Support')} showBackArrow />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        style={{ flex: 1 }}
      >
        {/* Ticket Type */}
        <TouchableOpacity
          style={[styles.dropdown, { backgroundColor: COLORS[theme].cardBackground }]}
          onPress={() => setShowCategoryList(!showCategoryList)}
        >
          <Text style={[styles.dropdownText, { color: COLORS[theme].textPrimary }]}>
            {selectedCategory || 'Select Ticket Type'}
          </Text>
          <Icon
            name={showCategoryList ? 'chevron-up' : 'chevron-down'}
            size={wp(5)}
            color={COLORS[theme].textPrimary}
          />
        </TouchableOpacity>

        {showCategoryList && (
          <View style={[styles.dropdownList, { backgroundColor: COLORS[theme].cardBackground }]}>
            {Object.keys(categories).map((cat, i) => (
              <TouchableOpacity
                key={i}
                style={styles.dropdownItem}
                onPress={() => {
                  setSelectedCategory(cat);
                  setSelectedSub('');
                  setShowCategoryList(false);
                }}
              >
                <Text style={[styles.dropdownOption, { color: COLORS[theme].textPrimary }]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Issue Type */}
        {selectedCategory && (
          <>
            <TouchableOpacity
              style={[styles.dropdown, { backgroundColor: COLORS[theme].cardBackground }]}
              onPress={() => setShowSubList(!showSubList)}
            >
              <Text style={[styles.dropdownText, { color: COLORS[theme].textPrimary }]}>
                {selectedSub || 'Select Issue Type'}
              </Text>
              <Icon
                name={showSubList ? 'chevron-up' : 'chevron-down'}
                size={wp(5)}
                color={COLORS[theme].textPrimary}
              />
            </TouchableOpacity>

            {showSubList && (
              <View style={[styles.dropdownList, { backgroundColor: COLORS[theme].cardBackground }]}>
                {categories[selectedCategory].map((sub, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setSelectedSub(sub);
                      setShowSubList(false);
                    }}
                  >
                    <Text style={[styles.dropdownOption, { color: COLORS[theme].textPrimary }]}>{sub}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        )}
        {/* Description */}
        <TextInput
          style={[poppins.regular.h7, styles.textarea, { backgroundColor: COLORS[theme].cardBackground, color: COLORS[theme].textPrimary }]}
          multiline
          numberOfLines={4}
          placeholder="Describe your issue..."
          placeholderTextColor={COLORS[theme].textPrimary}
          value={description}
          onChangeText={setDescription}
        />

        {/* Image Picker */}
        <View style={styles.imageContainer}>
          {imageUri ? (
            <View style={styles.imagePreviewWrapper}>
              <Image source={{ uri: imageUri }} style={styles.imagePreview} />
              <TouchableOpacity style={styles.removeIcon} onPress={removeImage}>
                <Icon name="close-circle" size={wp(6)} color="#FF5252" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.addImageBtn} onPress={selectImage}>
              <Icon name="plus" size={wp(6)} color="#fff" />
              <Text style={[styles.addImageText, {
                color: '#fff'
              }]}>Attach Image</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Animated Raise Button */}
        {selectedCategory && selectedSub && description && (
          <Animated.View style={{ opacity: fadeAnim }}>
            <TouchableOpacity
              style={[styles.raiseBtn, { backgroundColor: COLORS[theme].primary }]}
              onPress={raiseTicket}
            >
              <Text style={[styles.raiseBtnText, { color: COLORS[theme].background }]}>Raise Ticket</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </ScrollView>

      {/* Bottom Contact Card */}
      <View style={[styles.card, { backgroundColor: COLORS[theme].cardBackground }]}>
        <Text style={[styles.contactTitle, { color: COLORS[theme].textPrimary }]}>Need Help?</Text>
        <View style={styles.row}>
          <Icon name="whatsapp" size={wp(6)} color="#25D366" />
          <TouchableOpacity onPress={handleWhatsApp}>
            <Text style={[styles.linkText, { color: '#25D366' }]}>{phone}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.row}>
          <Icon name="email" size={wp(6)} color={COLORS[theme].textPrimary} />
          <TouchableOpacity onPress={handleEmail}>
            <Text style={[styles.linkText, { color: COLORS[theme].textPrimary }]}>{mailId}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </GestureHandlerRootView>
  );
};
const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: wp(4),    // paddingVertical: hp(1),
    paddingBottom: hp(25)
  }, dropdown: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: wp(3), borderRadius: 10, marginBottom: wp(2)
  }, dropdownText: { ...poppins.regular.h6 },
  dropdownList: { borderRadius: 10, marginBottom: wp(3) },
  dropdownItem: { padding: wp(3), borderBottomWidth: 0.5, borderColor: '#ccc' },
  dropdownOption: { ...poppins.regular.h6 },
  textarea: { borderRadius: 10, padding: wp(3), textAlignVertical: 'top', marginBottom: hp(2) },
  imageContainer: { marginBottom: hp(2), flexDirection: 'row', justifyContent: 'center' },
  addImageBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#4CAF50',
    paddingVertical: hp(1), paddingHorizontal: wp(4), borderRadius: 5
  }, addImageText: { color: '#fff', marginLeft: wp(2), ...poppins.medium.h7 },
  imagePreviewWrapper: { position: 'relative' }, imagePreview: { width: wp(30), height: wp(30), borderRadius: 10 }, removeIcon: { position: 'absolute', top: -10, right: -10 },
  raiseBtn: { marginTop: hp(2), paddingVertical: hp(1), borderRadius: 5, alignItems: 'center' },
  raiseBtnText: { ...poppins.regular.h5 }, card: {
    width: '95%', padding: wp(4), borderRadius: 12,
    position: 'absolute', bottom: hp(1), left: wp(2),
    right: 0, shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2, shadowRadius: 5, elevation: 5
  }, row: { flexDirection: 'row', alignItems: 'center', marginVertical: hp(0.5) },
  linkText: { ...poppins.medium.h9, marginLeft: wp(3) },
  contactTitle: { ...poppins.semi_bold.h7, marginBottom: hp(1) }
});

export default DeliveryPartnerSupport;
