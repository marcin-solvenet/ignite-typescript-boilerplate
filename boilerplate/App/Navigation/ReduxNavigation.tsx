import React from 'react';
import { BackHandler, Platform } from 'react-native';
import { connect } from 'react-redux';
import AppNavigation from './AppNavigation';
import {
  createReactNavigationReduxMiddleware,
  createReduxContainer
} from 'react-navigation-redux-helpers';
import { RootState } from '../Reducers';

export const navigationMiddleware = createReactNavigationReduxMiddleware(
  (state: RootState) => state.nav,
  'root'
);

const ReduxAppNavigator = createReduxContainer(AppNavigation, 'root');

interface ReduxNavigationProps {
  nav?: any;
  dispatch(object: object): any;
}

class ReduxNavigation extends React.Component<ReduxNavigationProps> {
  backButtonHandler = () => {
    const { dispatch, nav } = this.props;
    // change to whatever is your first screen, otherwise unpredictable results may occur
    if (nav.routes.length === 1 && nav.routes[0].routeName === 'LaunchScreen') {
      return false;
    }
    // if (shouldCloseApp(nav)) return false
    dispatch({ type: 'Navigation/BACK' });
    return true;
  };

  componentDidMount() {
    if (Platform.OS === 'ios') {
      return;
    }
    BackHandler.addEventListener('hardwareBackPress', this.backButtonHandler);
  }

  componentWillUnmount() {
    if (Platform.OS === 'ios') {
      return;
    }
    BackHandler.removeEventListener(
      'hardwareBackPress',
      this.backButtonHandler
    );
  }

  render() {
    return (
      <ReduxAppNavigator
        dispatch={this.props.dispatch}
        state={this.props.nav}
      />
    );
  }
}

const mapStateToProps = (state: RootState) => {
  return {
    nav: state.nav
  };
};
export default connect(mapStateToProps)(ReduxNavigation);
