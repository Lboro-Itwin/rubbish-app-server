/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import React, { useEffect } from "react";
import { useActiveViewport, CommonWidgetProps, StagePanelLocation, StagePanelSection, UiItemsProvider, WidgetState } from "@itwin/appui-react";
import { imageElementFromUrl, IModelApp } from "@itwin/core-frontend";
import { Point3d, Range2d } from "@itwin/core-geometry";
import { Alert, ToggleSwitch } from "@itwin/itwinui-react";
import { MarkerData, MarkerPinDecorator } from "../common/marker-pin/MarkerPinDecorator";
import { PlaceMarkerTool } from "../common/marker-pin/PlaceMarkerTool";
import { PopupMenu } from "../common/marker-pin/PopupMenu";
import MarkerPinApi from "./MarkerPinApi";
import "./MarkerPin.scss";
import { supabase } from "../db";
import { Cartographic } from "@itwin/core-common";

interface ManualPinSelection {
  name: string;
  image: string;
}

/** A static array of pin images. */
const manualPinSelections: ManualPinSelection[] = [
  { image: "pin_google_maps.svg", name: "Google Pin" },
  { image: "pin_celery.svg", name: "Celery Pin" },
  { image: "pin_poloblue.svg", name: "Polo blue Pin" },
];

const MarkerPinWidget = () => {
  const viewport = useActiveViewport();
  const [imagesLoadedState, setImagesLoadedState] = React.useState<boolean>(false);
  const [showDecoratorState, setShowDecoratorState] = React.useState<boolean>(true);
  const [markersDataState, setMarkersDataState] = React.useState<MarkerData[]>([]);
  const [rangeState, setRangeState] = React.useState<Range2d>(Range2d.createNull());
  const [heightState, setHeightState] = React.useState<number>(0);
  const [markerPinDecorator] = React.useState<MarkerPinDecorator>(() => {
    return MarkerPinApi.setupDecorator();
  });

  /** Load the images on widget startup */
  useEffect(() => {
    MarkerPinApi._images = new Map();
    const p1 = imageElementFromUrl("pin_google_maps.svg").then((image) => {
      MarkerPinApi._images.set("pin_google_maps.svg", image);
    });
    const p2 = imageElementFromUrl("pin_celery.svg").then((image) => {
      MarkerPinApi._images.set("pin_celery.svg", image);
    });
    const p3 = imageElementFromUrl("pin_poloblue.svg").then((image) => {
      MarkerPinApi._images.set("pin_poloblue.svg", image);
    });

    Promise.all([p1, p2, p3])
      .then(() => setImagesLoadedState(true))
      .catch((error) => console.error(error));
  }, []);

  /** Initialize Decorator */
  useEffect(() => {
    MarkerPinApi.enableDecorations(markerPinDecorator);
    return () => {
      MarkerPinApi.disableDecorations(markerPinDecorator);
    };
  }, [markerPinDecorator]);

  /** When the images are loaded, initialize the MarkerPin */
  useEffect(() => {
    if (!imagesLoadedState)
      return;

    void IModelApp.localization.registerNamespace("marker-pin-i18n-namespace");
    PlaceMarkerTool.register("marker-pin-i18n-namespace");
    MarkerPinApi.setMarkersData(markerPinDecorator, markersDataState);

    if (viewport)
      viewInit();
    else
      IModelApp.viewManager.onViewOpen.addOnce(() => viewInit());

    return () => {
      IModelApp.localization.unregisterNamespace("marker-pin-i18n-namespace");
      IModelApp.tools.unRegister(PlaceMarkerTool.toolId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imagesLoadedState]);

  useEffect(() => {
    if (showDecoratorState)
      MarkerPinApi.enableDecorations(markerPinDecorator);
    else
      MarkerPinApi.disableDecorations(markerPinDecorator);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showDecoratorState]);

  useEffect(() => {
    MarkerPinApi.setMarkersData(markerPinDecorator, markersDataState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markersDataState]);

  useEffect(() => {
    const fetchData = async () => {

      if (viewport) {

        const convertToSpatial = async (val: { long: number, lat: number }) => {

          const cart = Cartographic.fromDegrees(
            { latitude: val.lat, longitude: val.long, height: 0 }
          );

          return await viewport.iModel.cartographicToSpatial(cart);
        }

        const updateMarkers = async (arr: { [x: string]: any }[] | null) => {
          if (arr) {
            const markersData: MarkerData[] = [];
            for (const pos of arr ?? []) {
              const point = await convertToSpatial({ long: pos.long, lat: pos.lat });
              markersData.push({ point })
            }
            setMarkersDataState(markersData);
          }
        }

        supabase
          .channel('any')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'coords2' }, payload => {
            // should work for new items
            console.warn("Data channel from supabase has been updated", payload)
            updateMarkers([...markersDataState, payload.new])
          })
          .subscribe()

        const query = await supabase.from('coords2').select();

        await updateMarkers(query.data);
      }
    }

    Promise.resolve(fetchData()).catch(console.error)

  }, []);

  const viewInit = () => {
    if (!viewport)
      return;

    // Grab range of the contents of the view. We'll use this to position the random markers.
    const range3d = viewport.view.computeFitRange();
    const range = Range2d.createFrom(range3d);

    // Grab the max Z for the view contents.  We'll use this as the plane for the auto-generated markers. */
    const height = range3d.zHigh;

    setRangeState(range);
    setHeightState(height);
  };

  // Display drawing and sheet options in separate sections.
  return (
    <div className="sample-options">
      <ToggleSwitch className="show-markers" label="Show markers" labelPosition="right" checked={showDecoratorState} onChange={() => setShowDecoratorState(!showDecoratorState)} />

      <Alert type="informational" className="instructions">
        Use the options to control the marker pins. Click a marker to open a menu of options.
      </Alert>
      <PopupMenu canvas={viewport?.canvas} />
    </div>
  );
};

export class MarkerPinWidgetProvider implements UiItemsProvider {
  public readonly id: string = "MarkerPinWidgetProvider";

  public provideWidgets(_stageId: string, _stageUsage: string, location: StagePanelLocation, _section?: StagePanelSection): ReadonlyArray<CommonWidgetProps> {
    const widgets: CommonWidgetProps[] = [];
    if (location === StagePanelLocation.Bottom) {
      widgets.push(
        {
          id: "MarkerPinWidget",
          label: "Marker Pin Selector",
          defaultState: WidgetState.Open,
          getWidgetContent: () => <MarkerPinWidget />,
        }
      );
    }
    return widgets;
  }
}
