import {
  AxisOrientation,
  DataContainer,
  DataContainerTooltipExtension,
  GridLines,
  LabelPosition,
  LegendAlignment,
  LegendSeriesType,
  SnapValuesMatch,
  TooltipEventHandler,
  YValuesMatch,
} from '@kanva/charts';
import { AxisView, BarChartView, ChartGridView, LegendView } from '@kanva/charts-react';
import { View } from '@kanva/core';
import { Kanva, View as ViewComponent } from '@kanva/react';
import * as React from 'react';
import { chartGridStyle } from '../area-chart-sample/area-chart-sample.styles';
import { Crosshair } from '../crosshair';
import { Tooltip } from '../tooltip';
import { layout, Views } from './bar-chart-sample.layout';
import { MOCK } from './bar-chart-sample.mock';
import { barChartStyle, Series, SeriesColors, xAxisStyle, yAxisStyle } from './bar-chart-sample.styles';

const container = new DataContainer<number>()
  .setData([
    {
      name: Series.PRODUCTION,
      data: MOCK[Series.PRODUCTION],
    },
    {
      name: Series.CONSUMPTION,
      data: MOCK[Series.CONSUMPTION],
    },
  ])
  .setYBoundsExtension([0])
  .setPointAccessor((point, index) => ({
    x: index,
    y: point,
  }))
  .setXAxisParameters({
    isGrouped: true,
    labelAccessor: (value: number, index: number) => {
      return index.toString();
    },
  })
  .setYAxisParameters({
    tickCount: 8,
    useApproximateValues: true,
    labelAccessor: (value: number) => (value / 1000) + ' kWh',
  });

interface State {
  tooltipData?: {
    snap: SnapValuesMatch,
    match: YValuesMatch,
  };
}

export class BarChartSample extends React.Component<{}, State> {
  state: State = {};

  private tooltipExtension?: DataContainerTooltipExtension;

  constructor(props: {}) {
    super(props);
    this.tooltipExtension = new DataContainerTooltipExtension();
    this.tooltipExtension.registerTooltipEventHandler(this.handleTooltipEvent);

    container.addExtension(this.tooltipExtension);
  }

  handleCanvasRef = (canvas: HTMLCanvasElement | null) => {
    this.tooltipExtension!.registerCanvasOffset(canvas);
  };

  handleViewRef = (view: View<any>) => {
    if (this.tooltipExtension) {
      this.tooltipExtension.registerView(view);
    }
  };

  handleTooltipEvent: TooltipEventHandler = (event) => {
    if (this.state.tooltipData === event) {
      return;
    }

    /**
     * @TODO: the same thing is going to happen here
     */
    setTimeout(() => this.setState({ tooltipData: event }));
  };

  handleTooltipPositionChange = (x: number) => {
    if (this.tooltipExtension) {
      this.tooltipExtension.setPosition({ x, y: 0 });
    }
  };

  componentWillUnmount() {
    if (this.tooltipExtension) {
      container.removeExtension(this.tooltipExtension);
    }
  }

  render() {
    const { tooltipData } = this.state;
    return (
      <div className={'c-area-chart-sample'}>
        <Tooltip data={tooltipData && tooltipData.match} />
        <Kanva
          className={'c-sample-canvas'}
          enablePointerEvents={true}
          canvasRef={this.handleCanvasRef}
        >
          <LegendView
            id={Views.LEGEND}
            layoutParams={layout.legend}
            style={{
              padding: 8,
              alignment: LegendAlignment.ROW,
              fillStyle: '#FFF',
            }}
            dataSeries={[
              {
                name: 'Consumption',
                type: LegendSeriesType.PIE,
                fillStyle: SeriesColors[Series.CONSUMPTION],
              },
              {
                name: 'Production',
                lineWidth: 2,
                strokeStyle: SeriesColors[Series.PRODUCTION],
                radius: 1,
              },
            ]}
          />
          <ViewComponent layoutParams={layout.chartWrapper}>
            <ChartGridView
              layoutParams={layout.barChart}
              dataContainer={container}
              style={chartGridStyle}
              gridLines={GridLines.HORIZONTAL}
            />
            <BarChartView
              layoutParams={layout.barChart}
              dataContainer={container}
              labels={{
                font: {
                  fontFamily: 'Arial',
                  fontSize: 12,
                },
                fillStyle: '#FFF',
                labelAccessor: x => Math.floor(x / 1000).toString(),
                position: LabelPosition.OUT,
              }}
              style={barChartStyle}
              viewRef={this.handleViewRef}
              onMount={view => {
                const { absoluteX } = (view as any)
                  .getCanvasPositionForPoint({ x: 7, y: 0 });
                this.handleTooltipPositionChange(absoluteX);
              }}
            />
          </ViewComponent>
          <AxisView
            id={Views.X_AXIS}
            layoutParams={layout.xAxis}
            dataContainer={container}
            orientation={AxisOrientation.HORIZONTAL}
            style={xAxisStyle}
            borderColor={'#FFF'}
            border={{ top: 1 }}
          />
          <AxisView
            id={Views.Y_AXIS}
            layoutParams={layout.yAxis}
            dataContainer={container}
            orientation={AxisOrientation.VERTICAL}
            borderColor={'#FFF'}
            border={{ right: 1 }}
            style={yAxisStyle}
          />
        </Kanva>
        <Crosshair
          snap={tooltipData && tooltipData.snap}
          onMove={this.handleTooltipPositionChange}
        />
      </div>
    );
  }
}
