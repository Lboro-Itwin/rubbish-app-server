/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import React, { useEffect } from "react";
import { FrontstageManager } from "@itwin/appui-react";
import { IModelApp, ScreenViewport } from "@itwin/core-frontend";
import { Viewer, ViewerNavigationToolsProvider, ViewerViewportControlOptions } from "@itwin/web-viewer-react";
import { GlobalDisplayApi } from "./GlobalDisplayApi";
import { GlobalDisplayWidgetProvider } from "./GlobalDisplayWidget";
import { authClient } from "./common/AuthorizationClient";
import { mapLayerOptions, tileAdminOptions } from "./common/MapLayerOptions";

const uiProviders = [
  new GlobalDisplayWidgetProvider(),
  new ViewerNavigationToolsProvider(),
];
const viewportOptions: ViewerViewportControlOptions = {
  viewState: async (iModelConnection) => {
    IModelApp.viewManager.onViewOpen.addOnce((viewport: ScreenViewport) => {
      // The grid just gets in the way - turn it off.
      viewport.viewFlags = viewport.view.viewFlags.with("grid", false);

      // We're not interested in seeing the contents of the iModel, only the global data.
      if (viewport.view.isSpatialView())
        viewport.view.modelSelector.models.clear();
    });
    return GlobalDisplayApi.getInitialView(iModelConnection);
  },
};

const iTwinId = process.env.IMJS_ITWIN_ID;
const iModelId = process.env.IMJS_IMODEL_ID;

const GlobalDisplayApp = () => {
  /** Sign-in */
  useEffect(() => {
    void authClient.signIn();
  }, []);

  return <Viewer
    iTwinId={iTwinId ?? ""}
    iModelId={iModelId ?? ""}
    authClient={authClient}
    viewportOptions={viewportOptions}
    defaultUiConfig={
      {
        hideStatusBar: true,
        hideToolSettings: true,
      }
    } uiProviders={uiProviders}
    enablePerformanceMonitors={false}
    mapLayerOptions={mapLayerOptions}
    tileAdmin={tileAdminOptions}
    theme="dark"
  />;
};

// Define panel size
FrontstageManager.onFrontstageReadyEvent.addListener((event) => {
  const { bottomPanel } = event.frontstageDef;
  bottomPanel && (bottomPanel.size = 210);
});

export default GlobalDisplayApp;
