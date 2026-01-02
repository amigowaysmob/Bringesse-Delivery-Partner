import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  Alert, Platform, ToastAndroid, ScrollView, Image, BackHandler
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
import { poppins } from '../resources/fonts';
import AsyncStorage from '@react-native-async-storage/async-storage';

const uploadRegisterDocs = ({ route }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const siteDetails = useSelector(state => state.Auth.siteDetails);
  const { showBackArrow, userDatas } = route.params;
  // const userDatas = userDatas ? userDatas : null
  useFocusEffect(
    React.useCallback(() => {
// Alert.alert("TE4ST",JSON.stringify(userDatas));
      if (showBackArrow) return;
      const onBackPress = () => {
        showToast("Back button disabled on this screen");
        return true;
      };
      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress
      );

      return () => subscription.remove();
    }, [showBackArrow])
  );
  const [docs, setDocs] = useState({
    aadhar_front: null, aadhar_back: null,
    license_front: null, license_back: null,
    pan_front: null, pan_back: null,
    driver_image: null, vehicle_rc: null, insurance: null,
    driver_documents: [],
  });
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [deleteKey, setDeleteKey] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  useEffect(() => {

    if (!siteDetails?.media_url) return;
  }, [siteDetails]);
  const showToast = (msg) => {
    if (Platform.OS === "android") ToastAndroid.show(msg, ToastAndroid.SHORT);
    else Alert.alert(msg);
  };

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

    if (key === 'driver_documents') {

      setDocs(prev => ({
        ...prev,
        driver_documents: [
          ...prev.driver_documents,
          { uri: img.uri, name: img.fileName || `doc_${Date.now()}.jpg`, type: img.type || "image/jpeg", uploaded: false }
        ]
      }));
    } else {
      setDocs(prev => ({
        ...prev,
        [key]: { uri: img.uri, name: img.fileName || `${key}_${Date.now()}.jpg`, type: img.type || "image/jpeg", uploaded: false }
      }));
    }
  };

  const askDelete = key => {
    setDeleteKey(key);
    setModalVisible(true);
  };

  const removeImage = async () => {
    if (!deleteKey) return;
    setDeleteLoading(true);

    if (deleteKey === 'driver_documents') {
      const lastDoc = docs.driver_documents[docs.driver_documents.length - 1];
      setDocs(prev => ({
        ...prev,
        driver_documents: prev.driver_documents.filter(d => d !== lastDoc)
      }));

      if (lastDoc.uploaded) {
        const updatedPayload = {
          ...userDatas,
          driver_documents: userDatas.driver_documents.filter(d => d !== lastDoc.name)
        };
        try { await fnUpdateDocuments(updatedPayload); showMessage({ message: "Document removed", type: "success" }); }
        catch { showToast("Failed to remove"); }
      }
    } else {
      const doc = docs[deleteKey];
      setDocs(prev => ({ ...prev, [deleteKey]: null }));
      if (doc?.uploaded) {
        const updatedPayload = { ...userDatas, [deleteKey]: '' };
        try { await fnUpdateDocuments(updatedPayload); showMessage({ message: "Document removed", type: "success" }); }
        catch { showToast("Failed to remove"); }
      }
    }
    closeDelete();
  };
  const closeDelete = () => {
    setModalVisible(false);
    setDeleteKey(null);
    setDeleteLoading(false);
  };
  const handleUpload = async () => {
    const requiredFields = ["aadhar_front", "aadhar_back", "license_front", "license_back",
      "vehicle_rc", "insurance",
    ];
    const missing = requiredFields.filter(f => !docs[f]);
    if (missing.length > 0) return showToast(`Please upload: ${missing.join(", ")}`);
    const pendingEntries = Object.entries(docs).filter(([key, val]) => {
      if (key === 'driver_documents') return val.some(v => !v.uploaded);
      return val && !val.uploaded;
    });
    if (pendingEntries.length === 0) return showToast("Nothing to upload");
    setLoading(true);
    const formData = new FormData();
    const singleKeys = ["driver_image", "vehicle_rc", "insurance", "aadhar_front", "aadhar_back", "license_front", "license_back", "pan_front", "pan_back"];
    singleKeys.forEach(key => {
      const item = docs[key];
      if (item && !item.uploaded) formData.append(key, { uri: Platform.OS === 'android' ? item.uri : item.uri.replace('file://', ''), type: item.type, name: item.name });
    });
    console.log(formData, 'Upload formData');
    try {
      const res = await axios.post(
        'https://bringesse.com:3001/driver/fileupload',
        formData,
        { headers: { driver_id: userDatas?.driver_id } }
      );
      if (res.data?.status === 'true') {
        await fnUpdateDocuments(res.data);
        // Mark uploaded
        const updatedDocs = { ...docs };
        Object.keys(updatedDocs).forEach(key => {
          if (updatedDocs[key] && key !== 'driver_documents') updatedDocs[key].uploaded = true;
        });
        if (Array.isArray(updatedDocs.driver_documents)) updatedDocs.driver_documents = updatedDocs.driver_documents.map(d => ({ ...d, uploaded: true }));
        setDocs(updatedDocs);

        showMessage({ message: "Upload Complete", type: 'success' });
      } else {
        showToast(res.data?.message || 'Upload failed')
        await AsyncStorage.clear();
        navigation.reset({
          index: 0,
          routes: [{ name: 'login-screen' }],
        });
      };
    } catch (err) {
      console.log(err);
      showToast("Upload failed");
    }

    setLoading(false);
  };

  const fnUpdateDocuments = async (responseData) => {
    const payload = {
      driver_id: userDatas.driver_id,
      aadhar_front: responseData.aadhar_front || userDatas.aadhar_front || '',
      aadhar_back: responseData.aadhar_back || userDatas.aadhar_back || '',
      license_front: responseData.license_front || userDatas.license_front || '',
      license_back: responseData.license_back || userDatas.license_back || '',
      pan_front: responseData.pan_front || userDatas.pan_front || '',
      pan_back: responseData.pan_back || userDatas.pan_back || '',
      driver_image: responseData.driver_image || userDatas.driver_image || '',
      vehicle_rc: responseData.vehicle_rc || userDatas.vehicle_rc || '',
      insurance: responseData.insurance || userDatas.insurance || '',
    };
    console.log("Update Profile payload", payload);
    const data = await fetchData('updateprofile', 'PATCH', payload, {
      driver_id: userDatas?.driver_id,
      device_id: await DeviceInfo.getUniqueId(),
    });
    // Alert.alert("Update Profile payload",JSON.stringify(data));  
    console.log("Update Profile Response", data);
    if (data?.status === 'true') {
      showMessage({ message: 'Profile updated successfully!', type: 'success' });
      await AsyncStorage.clear();
      navigation.reset({
        index: 0,
        routes: [{ name: 'login-screen' }],
      });
    } else {
      showMessage({ message: 'Profile updated successfully!', type: 'danger' });
      await AsyncStorage.clear(); 
      navigation.reset({
        index: 0,
        routes: [{ name: 'login-screen' }],
      });
    }
    return data;
  };

  const renderDocBlock = (label, keyFront, keyBack, required = false) => (
    <View style={[styles.block, { backgroundColor: COLORS[theme].cardBackground }]}>
      <Text style={[poppins.semi_bold.h6, styles.blockTitle, { color: COLORS[theme].textPrimary }]}>{label} {required && <Text style={{ color: 'red' }}>*</Text>}</Text>
      {keyFront && renderImageBox(keyFront, "Front")}
      {keyBack && renderImageBox(keyBack, "Back")}
    </View>
  );

  const renderSingleDoc = (label, key, required = false) => (
    <View style={[styles.block, { backgroundColor: COLORS[theme].cardBackground }]}>
      <Text style={[poppins.semi_bold.h6, styles.blockTitle, { color: COLORS[theme].textPrimary }]}>{label} {required && <Text style={{ color: 'red' }}>*</Text>}</Text>
      {renderImageBox(key)}
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
              <Text style={{ color: COLORS[theme].black }}>{title || "Upload"}</Text>
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
  return (
    <View style={{ flex: 1, backgroundColor: COLORS[theme].background }}>
      <HeaderBar title={"Upload Documents"} showBackArrow={showBackArrow} />
      <View style={{ flex: 1, backgroundColor: COLORS[theme].background }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.container]}>
          {renderDocBlock("Aadhaar Card", "aadhar_front", "aadhar_back", true)}
          {renderDocBlock("Driving License", "license_front", "license_back", true)}
          {renderDocBlock("PAN Card", "pan_front", "pan_back", false)}
          {renderSingleDoc("Vehicle RC", "vehicle_rc", true)}
          {renderSingleDoc("Vehicle Insurance", "insurance", true)}
        </ScrollView>
        <View style={styles.fixedButtonWrapper}>
          <TouchableOpacity
            style={[styles.uploadButton, { backgroundColor: COLORS[theme].buttonBg }]} onPress={handleUpload} disabled={loading}>
            {loading ? <ActivityIndicator color={COLORS[theme].buttonText} /> : <Text style={[styles.uploadBtnText, { color: COLORS[theme].buttonText }]}>Upload All</Text>}
          </TouchableOpacity>
        </View>
        <ConfirmModal
          visible={modalVisible}
          onCancel={closeDelete}
          onConfirm={removeImage}
          loading={deleteLoading}
          title="Delete Document"
          message="Are you sure you want to delete this document?"
        />
      </View>
    </View>
  );
};
const styles = StyleSheet.create({
  container: { padding: wp(1), paddingBottom: hp(10) },
  block: { marginVertical: hp(1.5), padding: wp(4), borderRadius: wp(3), elevation: 3 },
  blockTitle: { marginBottom: wp(3) },
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
  fixedButtonWrapper: { position: "absolute", bottom: hp(2), width: "100%" },
});
export default uploadRegisterDocs;