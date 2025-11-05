import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, ToastAndroid, Platform,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { COLORS } from '../resources/colors';
import { hp, wp } from '../resources/dimensions';
import { poppins } from '../resources/fonts';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import HeaderBar from '../components/header';
import { showMessage } from 'react-native-flash-message';
import { fetchData } from '../api/api';
import FilePickerManager from 'react-native-file-picker';  // Import the file picker
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';  // Permissions handling
const UploadDocuments = () => {

  const { theme } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const profileDetails = useSelector(state => state.Auth.profileDetails);
  const accessToken = useSelector(state => state.Auth.accessToken);
  const [documentUri, setDocumentUri] = useState(null);
  const [loading, setLoading] = useState(false);

  // Check and request permissions for Android and iOS
  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      // Check for storage permission
      const permission = await check(PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE);
      if (permission === RESULTS.GRANTED) {
        console.log("Storage permission granted");
      } else {
        const result = await request(PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE);
        if (result === RESULTS.GRANTED) {
          console.log("Storage permission granted");
        } else {
          console.log("Storage permission denied");
          ToastAndroid.show('Permission denied to access files', ToastAndroid.SHORT);
        }
      }
    } else if (Platform.OS === 'ios') {
      const permission = await check(PERMISSIONS.IOS.PHOTO_LIBRARY);
      if (permission === RESULTS.GRANTED) {
        console.log("Photo Library permission granted");
      } else {
        const result = await request(PERMISSIONS.IOS.PHOTO_LIBRARY);
        if (result === RESULTS.GRANTED) {
          console.log("Photo Library permission granted");
        } else {
          console.log("Photo Library permission denied");
          ToastAndroid.show('Permission denied to access photo library', ToastAndroid.SHORT);
        }
      }
    }
  };

  // Handle document picker using react-native-file-picker
  const handleDocumentPicker = async () => {
    await requestPermissions();  // Request permission before showing the picker

    FilePickerManager.showFilePicker(
      (uri) => {
        if (uri) {
          setDocumentUri(uri); // Set the selected file's URI
          console.log('Document URI: ', uri); // For debugging purposes
        }
      },
      (error) => {
        console.error('File Picker Error: ', error);
        showMessage({ message: 'File Picker failed', type: 'danger' });
      },
    );
  };

  // Handle document upload
  const handleDocumentUpload = async () => {
    if (!documentUri) {
      ToastAndroid.show('No document selected', ToastAndroid.SHORT);
      showMessage({ message: 'No document selected', type: 'danger' });
      return;
    }

    if (!accessToken || !profileDetails?.driver_id) {
      ToastAndroid.show('Authorization error.', ToastAndroid.SHORT);
      showMessage({ message: 'Authorization error.', type: 'danger' });
      return;
    }

    setLoading(true); // Start loading

    const formData = new FormData();
    formData.append("document", {
      uri: Platform.OS === 'android' ? documentUri : documentUri.replace('file://', ''),
      name: 'document.pdf', // You can modify this if you have a name for the document
      type: 'application/pdf', // Adjust the MIME type as per the file selected
    });

    const requestOptions = {
      method: "POST",
      body: formData,
      headers: {
        "Authorization": accessToken,
        "driver_id": profileDetails.driver_id,
      },
      redirect: "follow",
    };

    try {
      const response = await fetch("https://bringesse.com:3001/driver/fileupload", requestOptions);
      const resultText = await response.text();
      console.log(resultText);

      try {
        const resultJson = JSON.parse(resultText);
        if (resultJson?.status === 'true') {
          await fnUpdateDocument(resultJson?.document_url); // Assuming you update with the document URL
        } else {
          ToastAndroid.show(resultJson?.message, ToastAndroid.SHORT);
          showMessage({ message: resultJson?.message || 'Upload failed.', type: 'danger' });
        }
      } catch (jsonErr) {
        console.error('JSON Parse Error:', jsonErr);
        showMessage({ message: 'Invalid server response.', type: 'danger' });
      }
    } catch (err) {
      console.error('Document upload failed', err);
      ToastAndroid.show('Failed to upload document.', ToastAndroid.SHORT);
      showMessage({ message: 'Failed to upload document.', type: 'danger' });
    } finally {
      setLoading(false); // End loading in any case
    }
  };

  // Update the document in the profile
  const fnUpdateDocument = async (documentUrl) => {
    const payLoad = {
      driver_id: profileDetails?.driver_id,
      document_url: documentUrl,
    };

    try {
      const data = await fetchData('updatedocument', 'PATCH', payLoad, {
        Authorization: `${accessToken}`,
        driver_id: profileDetails?.driver_id,
      });

      if (data?.status === 'true') {
        ToastAndroid.show(data?.message, ToastAndroid.SHORT);
        showMessage({ message: data?.message, type: 'success' });

        dispatch({
          type: 'UPDATE_PROFILE',
          payload: data,
        });

        setTimeout(() => {
          navigation?.goBack();
        }, 2000);
      } else {
        ToastAndroid.show(data?.message, ToastAndroid.SHORT);
        showMessage({ message: data?.message, type: 'danger' });
      }
    } catch (error) {
      console.error('updateDocument API Error:', error);
      showMessage({ message: 'Failed to update document.', type: 'danger' });
      ToastAndroid.show('Failed to update document.', ToastAndroid.SHORT);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: COLORS[theme].background }]}>
      <HeaderBar title={t('UploadDocument') || 'Upload Document'} showBackArrow={true} />

      <TouchableOpacity onPress={handleDocumentPicker}>
        <Text style={[styles.documentText, { color: COLORS[theme].text }]}>
          {documentUri ? JSON.stringify(documentUri) : 'No document selected'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handleDocumentUpload} // Changed to document upload directly
        style={[styles.documentButton, { borderColor: COLORS[theme].buttonBg }]}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color={COLORS[theme].buttonBg} />
        ) : (
          <Text style={[poppins.regular.h6, { color: COLORS[theme].buttonBg, lineHeight: wp(8) }]}>
            {t('upload_document') || 'Upload Document'}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  documentText: {
    fontSize: wp(4),
    marginTop: hp(2),
  },
  documentButton: {
    padding: wp(2),
    borderRadius: wp(1),
    borderWidth: wp(0.4),
    width: wp(50),
    alignItems: 'center',
    height: wp(12),
    marginVertical: hp(5),
    justifyContent: 'center',
  },
});

export default UploadDocuments;
