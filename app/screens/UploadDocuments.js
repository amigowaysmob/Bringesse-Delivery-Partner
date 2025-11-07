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
const UploadDocuments = () => {

  const { theme } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const profileDetails = useSelector(state => state.Auth.profileDetails);
  const accessToken = useSelector(state => state.Auth.accessToken);
  const [documentUri, setDocumentUri] = useState(null);
  const [loading, setLoading] = useState(false);


  return (
    <View style={[styles.container, { backgroundColor: COLORS[theme].background }]}>
      <HeaderBar title={t('Upload Document')} showBackArrow={true} />
      <TouchableOpacity>
        <Text style={[styles.documentText, { color: COLORS[theme].text }]}>
          {documentUri ? JSON.stringify(documentUri) : 'No document selected'}
        </Text>
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
});

export default UploadDocuments;
