import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  Alert, Platform, ToastAndroid, ScrollView, Image,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { COLORS } from '../resources/colors';
import { hp, wp } from '../resources/dimensions';
import { poppins } from '../resources/fonts';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import HeaderBar from '../components/header';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import {
  check, request, PERMISSIONS, RESULTS, openSettings,
} from 'react-native-permissions';
import axios from 'axios';
import { showMessage } from 'react-native-flash-message';
import { fetchData } from '../api/api';
import DeviceInfo from 'react-native-device-info';
// ⚡ Modal
import ConfirmModal from '../components/header/ConfirmModal';
const MAX_IMAGES = 5;
const UploadDocuments = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const accessToken = useSelector(state => state.Auth.accessToken);
  const profileDetails = useSelector(state => state.Auth.profileDetails);
  const siteDetails = useSelector(state => state.Auth.siteDetails);

  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // 🔥 Load Existing Images
  useEffect(() => {
    if (profileDetails?.driver_documents && siteDetails?.media_url) {
      const mappedImages = profileDetails.driver_documents.map(img => ({
        uri: siteDetails.media_url + 'drivers/documents/' + img,
        name: img,
        uploaded: true,
      }));
      setImages(mappedImages);
    }
  }, [profileDetails, siteDetails]);

  // 🔥 Toast
  const showToast = msg => {
    if (Platform.OS === 'android') ToastAndroid.show(msg, ToastAndroid.SHORT);
    else Alert.alert(msg);
  };

  // 🔥 Permission
  const requestCameraPermission = async () => {
    const permission =
      Platform.OS === 'ios'
        ? PERMISSIONS.IOS.CAMERA
        : PERMISSIONS.ANDROID.CAMERA;

    const result = await check(permission);

    switch (result) {
      case RESULTS.GRANTED:
        return true;
      case RESULTS.DENIED:
        return (await request(permission)) === RESULTS.GRANTED;
      case RESULTS.BLOCKED:
        Alert.alert(
          'Permission Blocked',
          'Camera permission is blocked. Enable it in settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: openSettings },
          ]
        );
        return false;
      default:
        return false;
    }
  };

  // 🔥 Camera
  const openCameraForDocs = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    const result = await launchCamera({
      mediaType: 'photo',
      quality: 0.9,
      saveToPhotos: false,
    });

    if (result.didCancel || result.errorCode) return;

    const asset = result.assets?.[0];
    if (asset) addImage(asset);
  };

  // 🔥 Gallery
  const openGallery = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      selectionLimit: MAX_IMAGES - images.length,
      quality: 0.9,
    });

    if (result.didCancel || result.errorCode) return;

    result.assets?.forEach(img => addImage(img));
  };

  // 🔥 Add Image
  const addImage = img => {
    if (images.length >= MAX_IMAGES) {
      showToast(`Maximum ${MAX_IMAGES} images allowed`);
      return;
    }

    setImages(prev => [
      ...prev,
      {
        uri: img.uri,
        name: img.fileName || `doc_${Date.now()}.jpg`,
        type: img.type || 'image/jpeg',
        uploaded: false,
      },
    ]);
  };

  // 🔥 Remove Trigger (opens modal)
  const confirmRemoveImage = index => {
    setDeleteIndex(index);
    setModalVisible(true);
  };

  // 🔥 Actually remove image (after modal confirm)
  const removeImage = async () => {
    if (deleteIndex === null) return;

    setDeleteLoading(true);

    const deletedImage = images[deleteIndex];

    // Remove from UI
    const updatedImages = images.filter((_, i) => i !== deleteIndex);
    setImages(updatedImages);

    // If image wasn't uploaded, no API call needed
    if (!deletedImage.uploaded) {
      setDeleteLoading(false);
      setModalVisible(false);
      return;
    }

    // Remove from server docs list
    const updatedServerDocs =
      (profileDetails?.driver_documents || []).filter(
        doc => doc !== deletedImage.name
      );

    try {
      await fnUpdateDocuments(updatedServerDocs);

      showMessage({
        message: 'Document removed successfully',
        type: 'success',
      });
    } catch (err) {
      console.error("Remove Error:", err);
      showToast('Failed to remove document');
    }

    setDeleteLoading(false);
    setModalVisible(false);
  };

  // 🔥 Upload Logic
  const handleUpload = async () => {
    const newImages = images.filter(img => !img.uploaded);
    if (newImages.length === 0) {
      showToast('No new images to upload');
      return;
    }

    setLoading(true);

    const formData = new FormData();
    newImages.forEach(img => {
      formData.append('driver_document', {
        uri: Platform.OS === 'android' ? img.uri : img.uri.replace('file://', ''),
        type: img.type,
        name: img.name,
      });
    });

    try {
      const res = await axios.post(
        'https://bringesse.com:3001/driver/fileupload',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: accessToken,
            driver_id: profileDetails?.driver_id,
          },
        }
      );

      if (res.data?.status === 'true') {
        const oldDocs = profileDetails?.driver_documents || [];
        const newDocs = res.data.driver_documents || [];

        const mergedDocs = [...oldDocs, ...newDocs];

        await fnUpdateDocuments(mergedDocs);

        // Update UI
        setImages(prev =>
          prev.map(img => ({ ...img, uploaded: true }))
        );

        showMessage({ message: 'Uploaded successfully!', type: 'success' });
      } else {
        showToast(res.data?.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload Error:', error);
      showToast('Upload failed');
    }

    setLoading(false);
  };

  // 🔥 Update profile API
  const fnUpdateDocuments = async docs => {
    const payload = {
      driver_id: profileDetails.driver_id,
      driver_documents: JSON.stringify(docs),
    };

    const data = await fetchData('updateprofile', 'PATCH', payload, {
      Authorization: accessToken,
      driver_id: profileDetails.driver_id,
      device_id: await DeviceInfo.getUniqueId(),
    });

    if (data?.status === 'true') {
      dispatch({ type: 'UPDATE_PROFILE', payload: data });
    }

    return data;
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: COLORS[theme].background }]}>

      <HeaderBar title={t('Upload Document')} showBackArrow />

      {/* Buttons */}
      <View style={{ flexDirection: 'row' }}>
        <TouchableOpacity
          onPress={openCameraForDocs}
          style={[styles.button, { borderColor: COLORS[theme].buttonBg }]}
        >
          <Text style={[poppins.regular.h6, { color: COLORS[theme].buttonBg }]}>
            OPEN CAMERA
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={openGallery}
          style={[styles.button, { borderColor: COLORS[theme].buttonBg }]}
        >
          <Text style={[poppins.regular.h6, { color: COLORS[theme].buttonBg }]}>
            OPEN GALLERY
          </Text>
        </TouchableOpacity>
      </View>

      {/* All Images */}
      <Text style={{ fontWeight: 'bold', marginVertical: hp(1) }}>All Images:</Text>
      <View style={styles.imageContainer}>
        {images.map((img, index) => (
          <View key={index} style={styles.imageWrapper}>
            <Image source={{ uri: img?.uri }} style={styles.previewImage} />
            <TouchableOpacity
              style={styles.removeIcon}
              onPress={() => confirmRemoveImage(index)}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>×</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* Upload Button */}
      <TouchableOpacity
        onPress={handleUpload}
        style={[styles.uploadButton, { backgroundColor: COLORS[theme].buttonBg }]}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={COLORS[theme].background} />
        ) : (
          <Text style={[poppins.regular.h6, { color: COLORS[theme].buttonText }]}>
            UPLOAD IMAGES
          </Text>
        )}
      </TouchableOpacity>

      {/* ❗ Delete Confirmation Modal */}
      <ConfirmModal
        visible={modalVisible}
        title="Confirm Delete"
        message="Are you sure you want to remove this document?"
        onCancel={() => setModalVisible(false)}
        onConfirm={removeImage}
        loading={deleteLoading}
      />

    </ScrollView>
  );
};

// Styles
const styles = StyleSheet.create({
  container: { flexGrow: 1, alignItems: 'center' },
  button: {
    padding: wp(2),
    borderRadius: wp(1),
    borderWidth: wp(0.4),
    width: wp(40),
    alignItems: 'center',
    height: wp(12),
    justifyContent: 'center',
    marginHorizontal: wp(3),
  },
  imageContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: hp(1),
  },
  imageWrapper: {
    position: 'relative',
    margin: wp(1),
  },
  previewImage: {
    width: wp(20),
    height: wp(20),
    borderRadius: wp(1),
  },
  removeIcon: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: 'red',
    width: wp(5),
    height: wp(5),
    borderRadius: wp(2.5),
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadButton: {
    padding: wp(3),
    borderRadius: wp(1),
    width: wp(60),
    alignItems: 'center',
    marginVertical: hp(2),
  },
});

export default UploadDocuments;
