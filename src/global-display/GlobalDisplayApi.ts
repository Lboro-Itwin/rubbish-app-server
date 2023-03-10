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


  // A view of Loughborough.
  public static readonly getInitialView = async (imodel: IModelConnection) => {

    const viewDefinitionProps: SpatialViewDefinitionProps = {
      angles: {
        pitch: -36.643205292469226,
        roll: 37.12167196850261,
        yaw: -144.83810880560975
      },
      camera: {
        eye: [-3811409.4645566414, 3097446.7986855856, -2300088.193305605],
        focusDist: 2934.539280380516,
        lens: 45.95389000000029,
      },
      cameraOn: true,
      categorySelectorId: "0x825",
      classFullName: "BisCore:SpatialViewDefinition",
      code: { scope: "0x28", spec: "0x1c", value: "" },
      description: "",
      displayStyleId: "0x824",
      extents: [2488.489369802362, 796.9769935851273, 2934.0403293819463],
      id: "0x822",
      isPrivate: false,
      model: "0x28",
      modelSelectorId: "0x823",
      origin: [-3808657.7388691483, 3096163.2521303953, -2301136.515086659],
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
