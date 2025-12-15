/******************************************************************************************
 *  UploadDocuments Screen
 *  Updated with:
 *   1. Driver Pic       (single)
 *   2. Vehicle RC       (single)
 *   3. Insurance        (single)
 *   4. Driver Documents (multi – your existing)
 ******************************************************************************************/

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
import ConfirmModal from '../components/header/ConfirmModal';
const MAX_DOC_IMAGES = 5;
const UploadDocuments = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const accessToken = useSelector(state => state.Auth.accessToken);
  const profileDetails = useSelector(state => state.Auth.profileDetails);
  const siteDetails = useSelector(state => state.Auth.siteDetails);

  /** -------------------- STATES --------------------------- */

  const [driverPic, setDriverPic] = useState(null);
  const [vehicleRC, setVehicleRC] = useState(null);
  const [insurance, setInsurance] = useState(null);

  const [docImages, setDocImages] = useState([]); // Your existing multi images
  const [loading, setLoading] = useState(false);

  // Delete modal
  const [modalVisible, setModalVisible] = useState(false);
  const [deleteInfo, setDeleteInfo] = useState({ type: null, index: null });
  const [deleteLoading, setDeleteLoading] = useState(false);

  /** ------------------------------------------------------------ */

  useEffect(() => {
    if (profileDetails && siteDetails?.media_url) {
      const base = siteDetails.media_url;
      if (profileDetails.driver_pic) {
        setDriverPic({
          uri: base + 'drivers/driverpic/' + profileDetails.driver_pic,
          name: profileDetails.driver_pic,
          uploaded: true,
        });
      }
      if (profileDetails.vehicle_rc) {
        setVehicleRC({
          uri: base + 'drivers/vehiclerc/' + profileDetails.vehicle_rc,
          name: profileDetails.vehicle_rc,
          uploaded: true,
        });
      }

      if (profileDetails.insurance) {
        setInsurance({
          uri: base + 'drivers/insurance/' + profileDetails.insurance,
          name: profileDetails.insurance,
          uploaded: true,
        });
      }

      if (profileDetails.driver_documents) {
        const mapped = profileDetails.driver_documents.map(img => ({
          uri: base + 'drivers/documents/' + img,
          name: img,
          uploaded: true,
        }));
        setDocImages(mapped);
      }
    }
  }, [profileDetails, siteDetails]);
  /** ------------------------------ HELPERS ---------------------------------- */
  const showToast = msg => {
    Platform.OS === 'android'
      ? ToastAndroid.show(msg, ToastAndroid.SHORT)
      : Alert.alert(msg);
  };

  const requestCameraPermission = async () => {
    const permission =
      Platform.OS === 'ios' ? PERMISSIONS.IOS.CAMERA : PERMISSIONS.ANDROID.CAMERA;

    const result = await check(permission);
    switch (result) {
      case RESULTS.GRANTED:
        return true;
      case RESULTS.DENIED:
        return (await request(permission)) === RESULTS.GRANTED;
      case RESULTS.BLOCKED:
        Alert.alert('Permission Blocked', 'Enable it in settings.', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: openSettings },
        ]);
        return false;
      default:
        return false;
    }
  };

  /** ------------------------------ IMAGE PICK HANDLERS -------------------------- */

  const pickImage = async callback => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    const result = await launchCamera({ mediaType: 'photo', quality: 0.9 });

    if (!result.didCancel && !result.errorCode) {
      const asset = result.assets?.[0];
      callback({
        uri: asset.uri,
        name: asset.fileName || `img_${Date.now()}.jpg`,
        type: asset.type || 'image/jpeg',
        uploaded: false,
      });
    }
  };

  const pickFromGallery = async callback => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.9,
    });

    if (!result.didCancel && result.assets?.[0]) {
      const asset = result.assets[0];
      callback({
        uri: asset.uri,
        name: asset.fileName || `img_${Date.now()}.jpg`,
        type: asset.type || 'image/jpeg',
        uploaded: false,
      });
    }
  };

  /** ------------------------------ MULTI-IMAGE DOC HANDLERS ---------------------- */

  const addDocImage = img => {
    if (docImages.length >= MAX_DOC_IMAGES) {
      showToast(`Maximum ${MAX_DOC_IMAGES} allowed`);
      return;
    }
    setDocImages(prev => [...prev, img]);
  };

  /** ------------------------------ DELETE HANDLING ------------------------------ */

  const confirmDelete = (type, index = null) => {
    setDeleteInfo({ type, index });
    setModalVisible(true);
  };

  const removeImage = async () => {
    const { type, index } = deleteInfo;
    setDeleteLoading(true);

    if (type === 'driverPic') setDriverPic(null);
    if (type === 'vehicleRC') setVehicleRC(null);
    if (type === 'insurance') setInsurance(null);

    if (type === 'docs') {
      const toDelete = docImages[index];
      const updated = docImages.filter((_, i) => i !== index);
      setDocImages(updated);

      if (toDelete.uploaded) {
        const updatedServerDocs = profileDetails.driver_documents.filter(
          d => d !== toDelete.name
        );
        await updateProfile({ driver_documents: updatedServerDocs });
      }
    }

    setModalVisible(false);
    setDeleteLoading(false);
  };

  /** ------------------------------ UPLOAD -------------------------------- */

  const uploadAll = async () => {
    setLoading(true);

    const form = new FormData();

    if (driverPic && !driverPic.uploaded)
      form.append('driver_pic', driverPic);

    if (vehicleRC && !vehicleRC.uploaded)
      form.append('vehicle_rc', vehicleRC);

    if (insurance && !insurance.uploaded)
      form.append('insurance', insurance);

    const newDocImages = docImages.filter(i => !i.uploaded);
    newDocImages.forEach(img =>
      form.append('driver_document', img)
    );

    try {
      const res = await axios.post(
        'https://bringesse.com:3001/driver/fileupload',
        form,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: accessToken,
            driver_id: profileDetails.driver_id,
          },
        }
      );

      if (res.data?.status === 'true') {
        // Update storing API
        await updateProfile({
          driver_pic: res.data?.driver_pic || profileDetails.driver_pic,
          vehicle_rc: res.data?.vehicle_rc || profileDetails.vehicle_rc,
          insurance: res.data?.insurance || profileDetails.insurance,
          driver_documents: [
            ...profileDetails.driver_documents,
            ...(res.data.driver_documents || []),
          ],
        });

        showMessage({ message: 'Uploaded successfully!', type: 'success' });
      } else {
        showToast(res.data?.message || 'Upload failed');
      }
    } catch (err) {
      console.error(err);
      showToast('Upload failed');
    }

    setLoading(false);
  };

  /** ------------------------------ UPDATE PROFILE API --------------------------- */

  const updateProfile = async updateData => {
    const payload = {
      driver_id: profileDetails.driver_id,
      ...updateData,
      driver_documents: JSON.stringify(updateData.driver_documents),
    };

    const data = await fetchData('updateprofile', 'PATCH', payload, {
      Authorization: accessToken,
      driver_id: profileDetails.driver_id,
      device_id: await DeviceInfo.getUniqueId(),
    });

    if (data?.status === 'true')
      dispatch({ type: 'UPDATE_PROFILE', payload: data });
  };

  /** ------------------------------ UI SECTIONS --------------------------- */

  const RenderBox = ({ title, image, onCamera, onGallery, deleteAction }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>

      {image ? (
        <View style={styles.imageWrapper}>
          <Image source={{ uri: image.uri }} style={styles.singleImage} />
          <TouchableOpacity
            onPress={deleteAction}
            style={styles.removeIcon}>
            <Text style={{ color: '#fff' }}>×</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.row}>
          <TouchableOpacity onPress={onCamera} style={styles.boxButton}>
            <Text>Camera</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onGallery} style={styles.boxButton}>
            <Text>Gallery</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <ScrollView contentContainerStyle={{ padding: wp(4) }}>
      <ConfirmModal
        visible={modalVisible}
        title="Confirm Delete"
        message="Are you sure?"
        loading={deleteLoading}
        onCancel={() => setModalVisible(false)}
        onConfirm={removeImage}
      />
    </ScrollView>
  );
};

/** ------------------------------ STYLES ------------------------------ */

const styles = StyleSheet.create({
  section: { marginVertical: wp(4) },
  sectionTitle: { fontWeight: 'bold', marginBottom: wp(2) },
  row: { flexDirection: 'row' },
  boxButton: {
    borderWidth: 1, padding: wp(3), borderRadius: wp(2), marginRight: wp(3)
  },
  imageWrapper: { position: 'relative', marginRight: wp(2) },
  singleImage: { width: wp(40), height: wp(40), borderRadius: wp(2) },
  previewImage: { width: wp(20), height: wp(20), borderRadius: wp(2) },
  removeIcon: {
    position: 'absolute', top: -10, right: -10,
    backgroundColor: 'red', width: wp(6), height: wp(6),
    borderRadius: wp(3), justifyContent: 'center', alignItems: 'center'
  },
  docContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: wp(3)
  },
  uploadButton: {
    padding: wp(4),
    backgroundColor: 'green',
    borderRadius: wp(2),
    alignItems: 'center',
    marginVertical: wp(6),
  },
});

export default UploadDocuments;
