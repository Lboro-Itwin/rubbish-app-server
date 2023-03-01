/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { DisplayStyle3dProps, SpatialViewDefinitionProps } from "@itwin/core-common";
import { BingLocationProvider, IModelConnection, queryTerrainElevationOffset, ScreenViewport, SpatialViewState } from "@itwin/core-frontend";

export class GlobalDisplayApi {
  private static _locationProvider?: BingLocationProvider;

  /** Provides conversion from a place name to a location on the Earth's surface. */
  public static get locationProvider(): BingLocationProvider {
    return this._locationProvider || (this._locationProvider = new BingLocationProvider());
  }

  /** Given a place name - whether a specific address or a more freeform description like "New Zealand", "Ol' Faithful", etc -
   * look up its location on the Earth and, if found, use a flyover animation to make the viewport display that location.
   */
  public static async travelTo(viewport: ScreenViewport, destination: string): Promise<boolean> {
    // Obtain latitude and longitude.
    const location = await this.locationProvider.getLocation(destination);
    if (!location)
      return false;

    // Determine the height of the Earth's surface at this location.
    const elevationOffset = await queryTerrainElevationOffset(viewport, location.center);
    if (elevationOffset !== undefined)
      location.center.height = elevationOffset;

    // "Fly" to the location.
    await viewport.animateFlyoverToGlobalLocation(location);
    return true;
  }

  // A view of Honolulu.
  public static readonly getInitialView = async (imodel: IModelConnection) => {

    const viewDefinitionProps: SpatialViewDefinitionProps = {
      angles: { pitch: 36.51434, roll: -152.05985, yaw: -7.09931 },
      camera: {
        eye: [-275742.30015, -6029894.49473, -4310387.86741],
        focusDist: 1178.36256,
        lens: 45.95389,
      },
      cameraOn: true,
      categorySelectorId: "0x825",
      classFullName: "BisCore:SpatialViewDefinition",
      code: { scope: "0x28", spec: "0x1c", value: "" },
      description: "",
      displayStyleId: "0x824",
      extents: [999.2514809355691, 945.1192630810807, 1178.3625627420267],
      id: "0x822",
      isPrivate: false,
      model: "0x28",
      modelSelectorId: "0x823",
      origin: [-276795.28703, -6029103.67946, -4310029.41901],
    };

    const displayStyleProps: DisplayStyle3dProps = {
      classFullName: "BisCore:DisplayStyle3d",
      code: { scope: "0x28", spec: "0xa", value: "" },
      id: "0x824",
      model: "0x28",
      jsonProperties: {
        styles: {
          backgroundMap: {
            applyTerrain: true,
            terrainSettings: { heightOriginMode: 0 },
          },
          environment: {
            ground: {
              display: false,
            },
            sky: {
              display: true,
              groundColor: 8228728,
              nadirColor: 3880,
              skyColor: 16764303,
              zenithColor: 16741686,
            },
          },
          viewflags: {
            backgroundMap: true,
            grid: false,
            renderMode: 6,
            visEdges: true,
          },
        },
      },
    };

    return SpatialViewState.createFromProps({
      viewDefinitionProps,
      displayStyleProps,
      categorySelectorProps: {
        categories: [],
        classFullName: "BisCore:CategorySelector",
        code: { scope: "0x28", spec: "0x8", value: "" },
        id: "0x825",
        model: "0x28",
      },
      modelSelectorProps: {
        classFullName: "BisCore:ModelSelector",
        code: { scope: "0x28", spec: "0x11", value: "" },
        id: "0x823",
        model: "0x28",
        models: [],
      },
    }, imodel);
  };
}

