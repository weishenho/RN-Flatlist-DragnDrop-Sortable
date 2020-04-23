import React, { createRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  PanResponder,
  Animated,
  SafeAreaView,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

// if using react navigation with header
// import { Header } from "react-navigation-stack";
const navHeight = 25; //Header.HEIGHT

function immutableMove(arr, from, to) {
  return arr.reduce((prev, current, idx, self) => {
    if (from === to) {
      prev.push(current);
    }
    if (idx === from) {
      return prev;
    }
    if (from < to) {
      prev.push(current);
    }
    if (idx === to) {
      prev.push(self[from]);
    }
    if (from > to) {
      prev.push(current);
    }
    return prev;
  }, []);
}

function getRandomColor() {
  var letters = "0123456789ABCDEF";
  var color = "#";
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export default class App extends React.Component {

  state = {
    dragging: false,
    draggingIdx: -1,
    data: Array.from(Array(35), (_, i) => {
      return { title: "title " + i, titleInfo: "titleInfo " + i, backgroundColor: getRandomColor(), height: getRandomInt(70, 150) };
    }),
    editIdx: -1,
    editNavURL: "",
    editIcon: "",
    editTitle: "",
    editTitleInfo: "",
    editVisible: true,
  };



  point = new Animated.ValueXY();
  currentY = 0;
  scrollOffset = 0;
  flatlistTopOffset = 0;
  rowHeight = 0;
  currentIdx = -1;
  active = false;
  flatList = createRef();
  flatListHeight = 0;
  itemsHeight = {};

  constructor(props) {
    super(props);

    this._panResponder = PanResponder.create({
      // Ask to be the responder:
      onStartShouldSetPanResponder: (evt, gestureState) => true,
      onStartShouldSetPanResponderCapture: (evt, gestureState) => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => true,
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => true,

      onPanResponderGrant: (evt, gestureState) => {
        // The gesture has started. Show visual feedback so the user knows
        // what is happening!
        // gestureState.d{x,y} will be set to zero now
        const orginPoint = gestureState.y0;
        this.currentIdx = this.yToIndex(orginPoint);
        this.currentY = gestureState.y0;

        Animated.event([{ y: this.point.y }])({
          y: orginPoint - this.rowHeight / 2 - navHeight,
        });
        this.active = true;
        this.setState({ dragging: true, draggingIdx: this.currentIdx }, () => {
          this.animateList();
        });
      },
      onPanResponderMove: (evt, gestureState) => {
        const currentY = gestureState.moveY;
        this.currentY = currentY;

        Animated.event([{ y: this.point.y }])({ y: currentY - navHeight * 1.5 });
        // The most recent move distance is gestureState.move{X,Y}
        // The accumulated gesture distance since becoming responder is
        // gestureState.d{x,y}
      },
      onPanResponderTerminationRequest: (evt, gestureState) => false,
      onPanResponderRelease: (evt, gestureState) => {
        // The user has released all touches while this view is the
        // responder. This typically means a gesture has succeeded
        this.reset();
      },
      onPanResponderTerminate: (evt, gestureState) => {
        // Another component has become the responder, so this gesture
        // should be cancelled
        this.reset();
      },
      onShouldBlockNativeResponder: (evt, gestureState) => {
        // Returns whether this component should block native components from becoming the JS
        // responder. Returns true by default. Is currently only supported on android.
        return true;
      },
    });
  }

  animateList = () => {
    if (!this.active) {
      return;
    }

    requestAnimationFrame(() => {
      // check if we are near the bottom or top
      if (this.currentY + 100 > this.flatListHeight) {
        this.flatList.current.scrollToOffset({
          offset: this.scrollOffset + 20,
          animated: false,
        });
      } else if (this.currentY < 100) {
        this.flatList.current.scrollToOffset({
          offset: this.scrollOffset - 20,
          animated: false,
        });
      }

      // check y value see if we need to reorder
      const newIdx = this.yToIndex(this.currentY);
      if (this.currentIdx !== newIdx) {
        this.setState({
          data: immutableMove(this.state.data, this.currentIdx, newIdx),
          draggingIdx: newIdx,
        });
        this.currentIdx = newIdx;
      }

      this.animateList();
    });
  };

  yToIndex = y => {
    // let value = Math.floor(
    //   (this.scrollOffset + y - this.flatlistTopOffset) / this.rowHeight
    // );

    let value = -1;
    const scroll_y = this.scrollOffset + y;
    const listLength = this.state.data.length;
    let accumulatedHeight = this.flatlistTopOffset;
    for (let i = 0; i < listLength; i++) {
      const itemHeight = this.itemsHeight[i];
      const newAccumulatedHeight = accumulatedHeight + itemHeight;
      if (scroll_y > accumulatedHeight && scroll_y < newAccumulatedHeight) {
        value = i;
        break;
      }
      accumulatedHeight = newAccumulatedHeight;
    }

    if (value < 0) {
      return 0;
    }

    if (value > this.state.data.length - 1) {
      return this.state.data.length - 1;
    }

    return value;
  };

  reset = () => {
    this.active = false;
    this.setState({ dragging: false, draggingIdx: -1 });
  };

  render() {
    const { data, dragging, draggingIdx } = this.state;

    const renderItem = ({ item, index }, noPanResponder = false) => {
      const { title, titleInfo, backgroundColor, height } = item;

      return (
        <View
          style={{
            padding: 20,
            flexDirection: "row",
            alignItems: "center",
            opacity: draggingIdx === index ? 0 : 1,
            backgroundColor,
            height
          }}
          onLayout={e => {
            this.rowHeight = e.nativeEvent.layout.height;
            this.itemsHeight[index] = e.nativeEvent.layout.height;
          }}
        >
          <View style={{ paddingHorizontal: 12, flexDirection: "row", justifyContent: "space-between", flex: 1 }}>
            <Text>{title}</Text>
            <Text>{titleInfo}</Text>
          </View>
          <View style={{ alignItems: "center", justifyContent: "center" }}>
            <View {...(noPanResponder ? {} : this._panResponder.panHandlers)}>
              <MaterialIcons name="drag-handle" size={28} />
            </View>
          </View>
        </View>
      );
    };

    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: "#fff",
          alignItems: "center",
        }}
      >
        {dragging && (
          <Animated.View
            style={{
              position: "absolute",
              backgroundColor: "white",
              borderWidth: 1,
              borderColor: "grey",
              zIndex: 2,
              width: "100%",
              top: this.point.getLayout().top,
            }}
          >
            {renderItem({ item: data[draggingIdx], index: -1 }, true)}
          </Animated.View>
        )}

        <View style={{ height: "100%", width: "100%" }}>
          <FlatList
            ref={this.flatList}
            ItemSeparatorComponent={this._flatListItemSeparator}
            scrollEnabled={!dragging}
            style={{ width: "100%" }}
            data={data}
            renderItem={renderItem}
            onScroll={e => {
              this.scrollOffset = e.nativeEvent.contentOffset.y;
            }}
            onLayout={e => {
              this.flatlistTopOffset = e.nativeEvent.layout.y + navHeight;
              this.flatListHeight = e.nativeEvent.layout.height;
            }}
            scrollEventThrottle={16}
            keyExtractor={(_, index) => "" + index}
          />
        </View>
      </SafeAreaView>
    );
  }
}
