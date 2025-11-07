import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  TouchableWithoutFeedback,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { COLORS } from '../../resources/colors';
import { wp, hp } from '../../resources/dimensions';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';

const SelectionModal = ({
  visible,
  data = [],
  onSelect,
  onDismiss,
  title = 'Select an option',
  multiSelect = false,
  selectedValues = [],
  maxSelection = 3,
}) => {
  const { theme } = useTheme();
  const [localSelected, setLocalSelected] = useState([]);

  useEffect(() => {
    setLocalSelected(selectedValues || []);
  }, [selectedValues, visible]);

  // ✅ Toggle a single item
  const toggleItem = (item) => {
    if (localSelected.includes(item.value)) {
      setLocalSelected((prev) => prev.filter((val) => val !== item.value));
    } else {
      setLocalSelected((prev) => [...prev, item.value]);
    }
  };

  // ✅ Toggle all (real) items
  const toggleAll = () => {
    const allValues = data.map((item) => item.value);
    const allSelected = allValues.every((val) => localSelected.includes(val));
    if (allSelected) {
      // Deselect all
      setLocalSelected([]);
    } else {
      // Select all
      setLocalSelected(allValues);
    }
  };

  // ✅ When user taps “Done”
  const handleConfirm = () => {
    const selectedItems = data.filter((item) =>
      localSelected.includes(item.value)
    );
    onSelect(selectedItems);
    onDismiss();
  };

  // ✅ Check if “All” should look active
  const allSelected =
    data.length > 0 &&
    data.every((item) => localSelected.includes(item.value));

  // ✅ Render each row
  const renderItem = ({ item }) => {
    const isSelected = localSelected.includes(item.value);
    return (
      <TouchableOpacity
        style={[
          styles.itemContainer,
          {
            borderBottomColor: COLORS[theme].border,
            backgroundColor: isSelected ? COLORS[theme].accent + '22' : 'transparent',
          },
        ]}
        onPress={() =>
          multiSelect ? toggleItem(item) : (onSelect(item), onDismiss())
        }
      >
        {multiSelect && (
          <MaterialCommunityIcon
            name={isSelected ? 'check-circle' : 'circle-outline'}
            size={wp(6)}
            color={COLORS[theme].accent}
            style={{ marginRight: wp(3) }}
          />
        )}
        <Text style={[styles.itemText, { color: COLORS[theme].textPrimary }]}>
          {item.label}
        </Text>
      </TouchableOpacity>
    );
  };

  // ✅ Add “Select All” as a header item (not in data)
  const renderHeader = () =>
    multiSelect ? (
      <TouchableOpacity
        style={[
          styles.itemContainer,
          {
            borderBottomColor: COLORS[theme].border,
            backgroundColor: allSelected
              ? COLORS[theme].accent + '22'
              : 'transparent',
          },
        ]}
        onPress={toggleAll}
      >
        <MaterialCommunityIcon
          name={allSelected ? 'check-circle' : 'circle-outline'}
          size={wp(6)}
          color={COLORS[theme].accent}
          style={{ marginRight: wp(3) }}
        />
        <Text style={[styles.itemText, { color: COLORS[theme].textPrimary }]}>
          Select All
        </Text>
      </TouchableOpacity>
    ) : null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <TouchableWithoutFeedback onPress={onDismiss}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>

      <View
        style={[
          styles.modalContainer,
          { backgroundColor: COLORS[theme].background },
        ]}
      >
        <Text style={[styles.title, { color: COLORS[theme].textPrimary }]}>
          {title}
        </Text>

        <FlatList
          data={data}
          keyExtractor={(item, index) => `${item.value}-${index}`}
          renderItem={renderItem}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={{ paddingBottom: hp(2) }}
        />

        {multiSelect && (
          <TouchableOpacity
            style={[styles.doneButton, { backgroundColor: COLORS[theme].accent }]}
            onPress={handleConfirm}
          >
            <Text style={{ color: COLORS[theme].white, textAlign: 'center' }}>
              Done
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#00000088',
  },
  modalContainer: {
    position: 'absolute',
    bottom: 0,
    width: wp(95),
    maxHeight: hp(60),
    borderTopLeftRadius: wp(4),
    borderTopRightRadius: wp(4),
    paddingHorizontal: wp(5),
    paddingVertical: wp(4),
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  title: {
    fontSize: wp(5),
    marginBottom: wp(3),
  },
  itemContainer: {
    paddingVertical: hp(2),
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemText: {
    fontSize: wp(4),
  },
  doneButton: {
    marginTop: hp(2),
    paddingVertical: hp(1.3),
    borderRadius: 5,
  },
});

export default SelectionModal;
