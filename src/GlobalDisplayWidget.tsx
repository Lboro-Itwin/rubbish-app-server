/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import React, { useEffect, useState } from "react";
import { AbstractWidgetProps, SpecialKey, StagePanelLocation, StagePanelSection, UiItemsProvider, WidgetState } from "@itwin/appui-abstract";
import { useActiveViewport } from "@itwin/appui-react";
import { BackgroundMapType } from "@itwin/core-common";
import { IModelApp, NotifyMessageDetails, OutputMessagePriority } from "@itwin/core-frontend";
import { SvgHelpCircularHollow } from "@itwin/itwinui-icons-react";
import { Alert, Button, IconButton, Input, Label, Text, ToggleSwitch } from "@itwin/itwinui-react";
import { GlobalDisplayApi } from "./GlobalDisplayApi";
import "./GlobalDisplay.scss";

const GlobalDisplayWidget = () => {
  const viewport = useActiveViewport();
  /** Place name to which to travel. */
  const [destination, setDestination] = useState<string>("");
  /** True for 3d terrain, false for a flat map. */
  const [terrain, setTerrain] = useState<boolean>(true);
  /** Display map labels with the map imagery. */
  const [mapLabels, setMapLabels] = useState<boolean>(false);
  /** Display 3d building meshes from Open Street Map Buildings. */
  const [buildings, setBuildings] = useState<boolean>(true);
  /** If buildings are displayed, also display their edges. */
  const [buildingEdges, setBuildingEdges] = useState<boolean>(true);

  useEffect(() => {
    if (viewport) {
      viewport.changeBackgroundMapProps({
        applyTerrain: terrain,
      });
      viewport.changeBackgroundMapProvider({ type: mapLabels ? BackgroundMapType.Hybrid : BackgroundMapType.Aerial });
    }
  }, [viewport, terrain, mapLabels]);

  useEffect(() => {
    if (viewport) {
      viewport.displayStyle.setOSMBuildingDisplay({ onOff: buildings });
    }
  }, [viewport, buildings]);

  useEffect(() => {
    if (viewport) {
      viewport.viewFlags = viewport.viewFlags.with("visibleEdges", buildingEdges);
    }
  }, [viewport, buildingEdges]);

  const _travelToDestination = async () => {
    if (!viewport)
      return;

    const locationFound = await GlobalDisplayApi.travelTo(viewport, destination);
    if (!locationFound) {
      const message = `Sorry, "${destination}" isn't recognized as a location.`;
      IModelApp.notifications.outputMessage(new NotifyMessageDetails(OutputMessagePriority.Warning, message));
    }
  };

  const _onKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === SpecialKey.Enter || e.key === SpecialKey.Return) {
      _travelToDestination()
        .catch((error) => {
          // eslint-disable-next-line no-console
          console.error(error);
        });
    }
  };

  const infoLabel = (label: string, tooltip: string) => (
    <span className="toggle-label">
      <Text>{label}</Text>
      <IconButton size="small" styleType="borderless" title={tooltip}><SvgHelpCircularHollow /></IconButton>
    </span>
  );

  return (
    <div className="sample-container">
      <div className="sample-options">
        <div className="sample-options-toggles">
          <ToggleSwitch
            label={infoLabel("Terrain", "Display 3d terrain from Cesium World Terrain Service")}
            checked={terrain}
            onChange={() => setTerrain(!terrain)}
          />
          <ToggleSwitch
            label={infoLabel("Map Labels", "Include labels in the Bing map imagery")}
            checked={mapLabels}
            onChange={() => setMapLabels(!mapLabels)}
          />
          <ToggleSwitch
            label={infoLabel("Buildings", "Display building meshes from Open Street Map")}
            checked={buildings}
            onChange={() => setBuildings(!buildings)}
          />
          <ToggleSwitch
            label={infoLabel("Building Edges", "Display the edges of the building meshes")}
            checked={buildingEdges}
            onChange={() => setBuildingEdges(!buildingEdges)}
          />
        </div>
        <div className="travel-destination">
          <Label htmlFor="destination">{infoLabel("Destination", "Type a place name and press enter to travel there")}</Label>
          <Input id="destination" size="small" className="travel-destination-input" onChange={(e) => setDestination(e.currentTarget.value)} onKeyPress={_onKeyPress} />
          <Button size="small" className="travel-destination-btn" styleType="cta" disabled={!destination.length} onClick={_travelToDestination} title={"Travel to the specified destination"}>Travel</Button>
        </div>
      </div>
      <Alert type="informational" className="instructions">
        Using the Global Display Controls Widget, type in the name of a location (e.g., "Mount Everest", "White House", your own address, etc),
        then click the button to travel there.
      </Alert>
    </div>
  );

};

export class GlobalDisplayWidgetProvider implements UiItemsProvider {
  public readonly id: string = "GlobalDisplayWidgetProvider";

  public provideWidgets(_stageId: string, _stageUsage: string, location: StagePanelLocation, _section?: StagePanelSection): ReadonlyArray<AbstractWidgetProps> {
    const widgets: AbstractWidgetProps[] = [];
    if (location === StagePanelLocation.Bottom) {
      widgets.push(
        {
          id: "GlobalDisplayWidget",
          label: "Global Display Controls",
          defaultState: WidgetState.Open,
          getWidgetContent: () => <GlobalDisplayWidget />,
        }
      );
    }
    return widgets;
  }
}
