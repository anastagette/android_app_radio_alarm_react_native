import React, { useState } from "react";
import { View, Switch} from "react-native";

const SwitchButton = (props) => {
  const [isEnabled, setIsEnabled] = useState(props.isEnabled);
  const toggleSwitch = (value) => { setIsEnabled(value); props.onPressSwitchButton(value); };

  return (
    <View>
      <Switch
        trackColor={{ false: "#767577", true: `#b0c4de` }}
        thumbColor={isEnabled ? `#000080` : "#f4f3f4"}
        ios_backgroundColor="#3e3e3e"
        onValueChange={toggleSwitch}
        value={isEnabled}
      />
    </View>
  );
}

export default SwitchButton;