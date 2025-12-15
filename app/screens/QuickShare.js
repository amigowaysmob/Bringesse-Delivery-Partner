import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image,
  TouchableOpacity, Linking,
  Share
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import HeaderBar from '../components/header';
import { COLORS } from '../resources/colors';
import { hp, wp } from '../resources/dimensions';
import { poppins } from '../resources/fonts';
import { IMAGE_ASSETS } from '../resources/images';
// -------------------- APP CARD COMPONENT --------------------

const AppCard = ({ item, theme }) => {
  return (
    <View style={[styles.card, { backgroundColor: COLORS[theme].card ,
      borderColor:theme == 'dark' ? "#555" : "#E0E0E0"
    }]}>
      <Image source={item.image} style={styles.appImage} />

      <View style={{ flex: 1 }}>
        <Text style={[poppins.semi_bold.h7,styles.appTitle, { color: COLORS[theme].textPrimary }]}>
          {item?.name}
        </Text>
        <Text style={[poppins.regular.h9,styles.appDesc, { color: COLORS[theme].textPrimary }]}>
          {item?.description}
        </Text>
        <View style={{ flexDirection: "row", justifyContent: "space-around" }}>
         
          <TouchableOpacity
            style={[styles.button, {
              backgroundColor: 'green',
            }]}
            onPress={() =>
              Share.share({
                message: `${item.name}\n${item.link}`,
              })
            }
          >
            <Text style={[poppins.regular.h6,styles.buttonText, {
              color: COLORS[theme].white
            }]}>Share App</Text>
          </TouchableOpacity>
        </View>

      </View>
    </View>
  );
};
// -------------------- MAIN SCREEN --------------------
const QuickShare = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const appList = [
    {
      id: 1,
      name: 'Bringsse Delivery User',
      description: 'Order items and track delivery with ease.',
      link: 'https://play.google.com/store/apps/details?id=com.app.bringessedeliveryuserapp&pcampaignid=web_share',
      image: IMAGE_ASSETS.bringesUser
    },
    {
      id: 2,
      name: 'Bringsse Seller',
      description: 'Manage your shop, products, and orders.',
      link: 'https://play.google.com/store/apps/details?id=com.app.bringessesellerapp&pcampaignid=web_share',
      image: IMAGE_ASSETS.seller
    },
    {
      id: 3,
      name: 'Bringsse Delivery Partner',
      description: 'Accept delivery tasks and track rewards.',
      link: 'https://play.google.com/store/apps/details?id=com.app.bringessedeliverypartner&pcampaignid=web_share',
      image: IMAGE_ASSETS.bringDeliveryPartner
    }
  ];

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: COLORS[theme].background }}>
      <HeaderBar title={t('Quick Share')} showBackArrow />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {appList.map(item => (
          <AppCard key={item.id} item={item} theme={theme} />
        ))}
      </ScrollView>
    </GestureHandlerRootView>
  );
};
// -------------------- STYLES --------------------
const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: wp(4),
    paddingVertical: hp(1),
  },
  card: {
    flexDirection: 'row', padding: wp(2), borderRadius: wp(3),
    marginBottom: hp(2), alignItems: 'center', borderBottomWidth: 1,borderRightWidth: 1
  },
  appImage: {
    width: wp(18), height: wp(18), borderRadius: wp(2),
    marginRight: wp(4),
    resizeMode: 'cover',
  },
  appTitle: { fontSize: wp(4.3), marginBottom: wp(1), },
  appDesc: {
    fontSize: wp(3.4), opacity: 0.8,
    marginBottom: wp(3),
  },
  button: {
    paddingVertical: hp(1), paddingHorizontal: wp(4),
    borderRadius: wp(1), alignSelf: 'flex-start',
  },
  buttonText: { fontSize: wp(3.5), },
});
export default QuickShare;