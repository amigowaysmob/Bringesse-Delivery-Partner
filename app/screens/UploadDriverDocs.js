// ----------------------------------------------------
// IMPORTS
// ----------------------------------------------------
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  Alert, Platform, ToastAndroid, ScrollView, Image,BackHandler
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { COLORS } from '../resources/colors';
import { hp, wp } from '../resources/dimensions';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import HeaderBar from '../components/header';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import {
  check, request, PERMISSIONS, RESULTS, openSettings,
} from 'react-native-permissions';
import axios from 'axios';
import { showMessage } from 'react-native-flash-message';
import { fetchData } from '../api/api';
import DeviceInfo from 'react-native-device-info';
import ConfirmModal from '../components/header/ConfirmModal';

const UploadDriverDocs = ({ route }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const accessToken = useSelector(state => state.Auth.accessToken);
  const profileDetails = useSelector(state => state.Auth.profileDetails);
  const siteDetails = useSelector(state => state.Auth.siteDetails);
  const { showBackArrow } = route.params;

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        // Show toast or alert if needed
        showToast("Back button disabled on this screen");
        return true; // returning true disables back action
      };
      BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [])
  );

  // ----------------------------------------------------
  // STATE
  // ----------------------------------------------------
  const [docs, setDocs] = useState({
    aadhar_front: null,
    aadhar_back: null,
    license_front: null,
    license_back: null,
    pan_front: null,
    pan_back: null,
    driver_image: null,
    driver_documents: [],
  });
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [deleteKey, setDeleteKey] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ----------------------------------------------------
  // LOAD EXISTING DOCUMENTS FROM SERVER
  // ----------------------------------------------------
  useEffect(() => {
    if (!profileDetails || !siteDetails?.media_url) return;
    console?.log(profileDetails, "profileDetails")
    // Alert.alert(profileDetails?.aadhar_front)
    const updated = { ...docs };
    const baseURL = siteDetails.media_url + "drivers/documents/";

    // Individual files
    const fields = ['aadhar_front', 'aadhar_back', 'pan_front', 'pan_back', 'license_front', 'license_back', 'driver_image'];
    fields.forEach(field => {
      if (profileDetails[field]) {
        updated[field] = { uri: baseURL + profileDetails[field], name: profileDetails[field], uploaded: true };
      }
    });

    // Driver multiple documents
    if (Array.isArray(profileDetails.driver_documents)) {
      updated.driver_documents = profileDetails.driver_documents.map(name => ({
        uri: baseURL + name,
        name,
        uploaded: true
      }));
    }

    setDocs(updated);
  }, [profileDetails, siteDetails]);

  // ----------------------------------------------------
  // TOAST
  // ----------------------------------------------------
  const showToast = (msg) => {
    if (Platform.OS === "android") ToastAndroid.show(msg, ToastAndroid.SHORT);
    else Alert.alert(msg);
  };

  // ----------------------------------------------------
  // CAMERA PERMISSION
  // ----------------------------------------------------
  const requestCameraPermission = async () => {
    const permission =
      Platform.OS === "ios" ? PERMISSIONS.IOS.CAMERA : PERMISSIONS.ANDROID.CAMERA;

    const result = await check(permission);

    if (result === RESULTS.GRANTED) return true;
    if (result === RESULTS.DENIED) return (await request(permission)) === RESULTS.GRANTED;
    if (result === RESULTS.BLOCKED) {
      Alert.alert(
        "Permission Blocked",
        "Camera permission is blocked. Enable in settings.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Open Settings", onPress: openSettings }
        ]
      );
    }
    return false;
  };

  // ----------------------------------------------------
  // IMAGE PICK FUNCTIONS
  // ----------------------------------------------------
  const pickFromCamera = async (key) => {
    const ok = await requestCameraPermission();
    if (!ok) return;

    const res = await launchCamera({ mediaType: "photo", quality: 0.5 });
    if (!res.didCancel && !res.errorCode) applyImage(key, res.assets?.[0]);
  };

  const pickFromGallery = async (key) => {
    const res = await launchImageLibrary({ mediaType: "photo", quality: 0.5 });
    if (!res.didCancel && !res.errorCode) applyImage(key, res.assets?.[0]);
  };

  const applyImage = (key, img) => {
    if (!img) return;

    setDocs(prev => ({
      ...prev,
      [key]: {
        uri: img.uri,
        name: img.fileName || `${key}_${Date.now()}.jpg`,
        type: img.type || "image/jpeg",
        uploaded: false,
      }
    }));
  };

  // ----------------------------------------------------
  // DELETE DOCUMENT
  // ----------------------------------------------------
  const askDelete = key => {
    setDeleteKey(key);
    setModalVisible(true);
  };

  const removeImage = async () => {
    if (!deleteKey) return;
    setDeleteLoading(true);
    const doc = docs[deleteKey];
    setDocs(prev => ({ ...prev, [deleteKey]: null }));
    // Only call API if uploaded
    if (doc?.uploaded) {
      const updatedPayload = {
        ...profileDetails,
        [deleteKey]: '',
        driver_documents: profileDetails.driver_documents.filter(x => x !== doc.name)
      };
      try {
        await fnUpdateDocuments(updatedPayload);
        showMessage({ message: "Document removed", type: "success" });
      } catch {
        showToast("Failed to remove");
      }
    }
    closeDelete();
  };
  const closeDelete = () => {
    setModalVisible(false);
    setDeleteKey(null);
    setDeleteLoading(false);
  };
  // ----------------------------------------------------
  // UPLOAD DOCUMENTS
  // ----------------------------------------------------
  const handleUpload = async () => {
    const pendingEntries = Object.entries(docs).filter(([key, val]) => {
      if (key === 'driver_documents') return val.some(v => !v.uploaded);
      return val && !val.uploaded;
    });
    if (pendingEntries.length === 0) return showToast("Nothing to upload");
    setLoading(true);
    const formData = new FormData();
    // Append individual fields
    ['driver_image', 'aadhar_front', 'aadhar_back', 'pan_front', 'pan_back', 'license_front', 'license_back'].forEach(key => {
      const item = docs[key];
      if (item && !item.uploaded) {
        formData.append(key, {
          uri: Platform.OS === 'android' ? item.uri : item.uri.replace('file://', ''),
          type: item.type,
          name: item.name
        });
      }
    });
    try {
      const res = await axios.post(
        'https://bringesse.com:3001/driver/fileupload',
        formData,
        { headers: { Authorization: accessToken, driver_id: profileDetails.driver_id } }
      );
      if (res.data?.status === 'true') {
        // Pass entire response to update profile
        await fnUpdateDocuments(res.data);
        // Mark uploaded items as uploaded
        const updatedDocs = { ...docs };
        Object.keys(updatedDocs).forEach(key => {
          if (updatedDocs[key] && key !== 'driver_documents') updatedDocs[key].uploaded = true;
        });
        if (Array.isArray(updatedDocs.driver_documents)) {
          updatedDocs.driver_documents = updatedDocs.driver_documents.map(doc => ({ ...doc, uploaded: true }));
        }
        setDocs(updatedDocs);
        showMessage({ message: "Upload Complete", type: 'success' });
      } else showToast(res.data?.message || 'Upload failed');

    } catch (err) {
      console.log(err);
      showToast("Upload failed");
    }
    setLoading(false);
  };
  // ----------------------------------------------------
  // UPDATE PROFILE API
  // ----------------------------------------------------
  const fnUpdateDocuments = async (responseData) => {
    console?.log(responseData, "responseData")
    console.log(responseData.aadhar_front, 'responseData.aadhar_front')
    const payload = {
      driver_id: profileDetails.driver_id,
      aadhar_front: responseData.aadhar_front || profileDetails.aadhar_front || '',
      aadhar_back: responseData.aadhar_back || profileDetails.aadhar_back || '',
      pan_front: responseData.pan_front || profileDetails.pan_front || '',
      pan_back: responseData.pan_back || profileDetails.pan_back || '',
      license_front: responseData.license_front || profileDetails.license_front || '',
      license_back: responseData.license_back || profileDetails.license_back || '',
    };
    const data = await fetchData('updateprofile', 'PATCH', payload, {
      Authorization: accessToken,
      driver_id: profileDetails.driver_id,
      device_id: await DeviceInfo.getUniqueId(),
    });
    // Alert.alert(JSON.stringify(data))
    if (data?.status === 'true') {
      dispatch({ type: 'UPDATE_PROFILE', payload: data });
      showMessage({ message: 'Profile updated successfully!', type: 'success' });
      navigation?.goBack();
    }
    else {
      console?.log("Errr", data)
    }
    return data;
  };
  // ----------------------------------------------------
  // UI - Render Blocks
  // ----------------------------------------------------
  const renderDocBlock = (label, keyFront, keyBack, required = false) => (
    <View style={[styles.block, { backgroundColor: COLORS[theme].cardBackground }]}>
      <Text style={[styles.blockTitle, { color: COLORS[theme].text }]}>{label} {required && <Text style={{ color: 'red' }}>*</Text>}</Text>
      {renderImageBox(keyFront, "Front")}
      {renderImageBox(keyBack, "Back")}
    </View>
  );
  const renderImageBox = (key, title) => {
    const item = docs[key];
    return (
      <View style={styles.imageRow}>
        <View style={styles.imageContainer}>
          {item ? (
            <>
              <Image source={{ uri: item.uri }} style={styles.uploadedImage} />
              {!showBackArrow &&
                <TouchableOpacity style={styles.removeIcon} onPress={() => askDelete(key)}>
                  <Text style={{ color: '#fff', fontWeight: 'bold' }}>×</Text>
                </TouchableOpacity>}
            </>
          ) : (
            <TouchableOpacity
              style={styles.placeholder}
              onPress={() => pickFromGallery(key)}
              onLongPress={() => pickFromCamera(key)}
            >
              <Text style={{ color: COLORS[theme].black }}>{title}</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity style={[styles.smallBtn, { borderColor: COLORS[theme].primary }]} onPress={() => pickFromCamera(key)}>
            <Text style={[styles.smallBtnText, { color: COLORS[theme].primary }]}>Camera</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.smallBtn, { borderColor: COLORS[theme].primary }]} onPress={() => pickFromGallery(key)}>
            <Text style={[styles.smallBtnText, { color: COLORS[theme].primary }]}>Gallery</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // ----------------------------------------------------
  // RETURN UI
  // ----------------------------------------------------
  return (
    <>
      <HeaderBar title="Upload Documents" showBackArrow={showBackArrow} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.container, { backgroundColor: COLORS[theme].background }]}
      >
        {renderDocBlock("Aadhaar Card", "aadhar_front", "aadhar_back", true)}
        {renderDocBlock("Driving License", "license_front", "license_back", true)}
        {renderDocBlock("PAN Card", "pan_front", "pan_back", false)}

        <ConfirmModal
          visible={modalVisible}
          onCancel={closeDelete}
          onConfirm={removeImage}
          loading={deleteLoading}
          title="Delete Document"
          message="Are you sure you want to delete this document?"
        />

        <TouchableOpacity
          style={[styles.uploadButton, { backgroundColor: COLORS[theme].buttonBg }]}
          onPress={handleUpload}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color={COLORS[theme].buttonText} /> :
            <Text style={[styles.uploadBtnText, { color: COLORS[theme].buttonText }]}>UPLOAD ALL</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </>
  );
};
// ----------------------------------------------------
// STYLES
// ----------------------------------------------------
const styles = StyleSheet.create({
  container: { padding: wp(1), paddingBottom: hp(10) },
  block: { marginVertical: hp(1.5), padding: wp(4), borderRadius: wp(3), elevation: 3 },
  blockTitle: { fontSize: wp(5), fontWeight: "700", marginBottom: wp(3) },
  imageRow: { flexDirection: "row", alignItems: "center", marginBottom: wp(4) },
  imageContainer: { width: wp(30), height: wp(30), borderRadius: wp(2), overflow: "hidden", backgroundColor: "#eee" },
  placeholder: { flex: 1, justifyContent: "center", alignItems: "center", borderWidth: 1.2, borderColor: "#bbb", backgroundColor: "#f5f5f5" },
  uploadedImage: { width: "100%", height: "100%", borderRadius: wp(2) },
  removeIcon: { position: "absolute", top: 5, right: 5, backgroundColor: "red", width: wp(6), height: wp(6), borderRadius: wp(3), justifyContent: "center", alignItems: "center" },
  actionButtons: { marginLeft: wp(4) },
  smallBtn: { paddingVertical: wp(3), paddingHorizontal: wp(8), borderRadius: wp(2), borderWidth: 1.5, marginBottom: wp(2) },
  smallBtnText: { fontSize: wp(4), fontWeight: "600" },
  uploadButton: { alignSelf: "center", marginTop: hp(2), paddingVertical: wp(3), paddingHorizontal: wp(15), borderRadius: wp(3), elevation: 3 },
  uploadBtnText: { fontSize: wp(4.5), fontWeight: "700", textAlign: "center" },
});
export default UploadDriverDocs;
