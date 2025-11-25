import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  View, Text, StyleSheet,
  Image, Alert,  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { COLORS } from '../resources/colors';
import { wp, hp } from '../resources/dimensions';
import { poppins } from '../resources/fonts';
import { useDispatch, useSelector } from 'react-redux';
import { fetchData } from '../api/api';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import DeviceInfo from 'react-native-device-info';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
const CheckDocs = ({ userstatus }) => {
  const [isOnline] = useState(userstatus);
  const { theme } = useTheme();
  const { t } = useTranslation();
  const siteDetails = useSelector(state => state.Auth?.siteDetails);
  const accessToken = useSelector(state => state.Auth?.accessToken);
  const profileDetails = useSelector(state => state.Auth.profileDetails);
  const dispatch = useDispatch();
  const fullName = `${profileDetails?.first_name || ''} ${profileDetails?.last_name || ''}`.trim();
  const address = profileDetails?.location || t('No address available');
  useEffect(() => {
    fetchProfileData();
    // Alert.alert(JSON.stringify(profileDetails?.driver_documents.length,null,2));
  }, []);
  const navigation = useNavigation();
  const fetchProfileData = async () => {
    // Alert.alert(profileDetails?.profile_status ? "1" :"0"  )
    if (!accessToken || !profileDetails?.driver_id) return;
    try {
      const data = await fetchData('profile/' + profileDetails?.driver_id, 'GET', null, {
        Authorization: `${accessToken}`,
        driver_id: profileDetails.driver_id,
        device_id: await DeviceInfo.getUniqueId(),
      });
      if (!data?.ok && data?.status == 'false') {
        // Alert.alert('Session Expired', 'Please log in again.', )
        await AsyncStorage.clear();
        navigation.reset({
          index: 0,
          routes: [{ name: 'login-screen' }],
        });
      }
      dispatch({
        type: 'PROFILE_DETAILS',
        payload: data,
      });
    } catch (error) {
      console.error('profile API Error:', error);
    }
  };
  if (!profileDetails?.aadhar_front
     && profileDetails?.profile_status
    ) {
    return navigation.navigate('UploadDriverDocs',{showBackArrow:false});
  };
  return (
    <>
      {/* <View style={[
        styles.card,
        { backgroundColor: COLORS[theme].background }
      ]}>
        <View>
          {
            siteDetails?.doc_empty ?
              <Image
                source={{ uri: siteDetails?.doc_empty }}
                style={styles.profileImage}
              />
              :
              <MaterialCommunityIcon name="file-document-outline" size={wp(50)} color={COLORS[theme].accent} />

          }

        </View>
        <TouchableOpacity style={{ backgroundColor: COLORS[theme].accent, width: wp(85), alignItems: "center", marginTop: wp(1), height: wp(11), borderRadius: wp(2) }} onPress={() => navigation.navigate('UploadDocuments')}>
          <Text style={{
            fontSize: wp(4.5),
            color: COLORS[theme].white,
            marginBottom: hp(1), lineHeight: hp(4.5),
          }}>
            {t('Upload Documents')}
          </Text>
        </TouchableOpacity>
      </View> */}
    </>
  );
};
export default CheckDocs;
const styles = StyleSheet.create({
  card: {
    paddingVertical: hp(1),
    paddingHorizontal: wp(4),
    borderRadius: wp(2),
    borderWidth: wp(0.3),
    borderColor: '#ccc',
    alignItems: "center", justifyContent: "center",
    alignSelf: "center", width: wp(95),
    height: hp(30)
  },
  profileImage: {
    width: wp(50),
    height: wp(50),
    // borderRadius: wp(12.5),
    marginRight: wp(4),
    alignItems: "center", justifyContent: "center"
  },
});
