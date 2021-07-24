import React from 'react';
import { stylesFactory } from '@grafana/ui';
import { formattedValueToString, getFieldColorModeForField, GrafanaTheme, reduceField, ReducerID } from '@grafana/data';
import { css } from '@emotion/css';
import { config } from 'app/core/config';
import { DimensionSupplier } from '../../dims/types';
import { getMinMaxAndDelta } from '../../../../../../../packages/grafana-data/src/field/scale'; 

export interface MarkersLegendProps {
  color?: DimensionSupplier<string>;
  size?: DimensionSupplier<number>;
}
export function MarkersLegend(props: MarkersLegendProps) {
  const { color } = props;
  const style = getStyles(config.theme);
  if (!color) {
    return (
      <></>
    )
  }
  if (!color.field && color.fixed) {
    return <div className={style.infoWrap}>Fixed: {color.fixed}</div>;
  }

  const fmt = (v: any) => `${formattedValueToString(color.field!.display!(v))}`;
  const colorMode = getFieldColorModeForField(color.field!);
  
  if (colorMode.isContinuous && colorMode.getColors) {
    const colorRange = getMinMaxAndDelta(color.field!)
    const stats = reduceField({
      field: color.field!,
      reducers: [
        ReducerID.min,
        ReducerID.max,
        ReducerID.mean,
        // std dev?
      ]
    })

    // getColors return an array of color string from the color scheme chosen
    const colors = colorMode.getColors(config.theme2);
    console.log('TODO use gradient', colors);
    //TODO: can we get the same gradiant scale img as the option dropdown?
    return <>
    <div className={style.gradientContainer}>
      <div className={style.minVal}>{fmt(colorRange.min)}</div>
      <div className={style.maxVal}>{fmt(colorRange.max)}</div>
    </div>
    <pre>{JSON.stringify(colorRange)}</pre>
    <pre>{JSON.stringify({min:stats.min, max:stats.max, mean:stats.mean})}</pre>
    </>
  }

  const thresholds = color.field?.config?.thresholds;
  if (!thresholds) {
    return <div className={style.infoWrap}>no thresholds????</div>;
  }

  return (
    <div className={style.infoWrap}>
      {thresholds && (
        <div className={style.legend}>
          {thresholds.steps.map((step:any, idx:number) => {
            const next = thresholds!.steps[idx + 1];
            let info = <span>?</span>;
            if (idx === 0) {
              info = <span>&lt; {fmt(next.value)}</span>;
            } else if (next) {
              info = (
                <span>
                  {fmt(step.value)} - {fmt(next.value)}
                </span>
              );
            } else {
              info = <span>{fmt(step.value)} +</span>;
            }
            return (
              <div key={`${idx}/${step.value}`} className={style.legendItem}>
                <i style={{ background: config.theme2.visualization.getColorByName(step.color) }}></i>
                {info}
              </div>
            );
          })}
        </div>
      )}
    </div>
  )
}

const getStyles = stylesFactory((theme: GrafanaTheme) => ({
  infoWrap: css`
    color: #999;
    background: #CCCC;
    border-radius: 2px;
    padding: 8px;
  `,
  legend: css`
    line-height: 18px;
    color: #555;
    display: flex;
    flex-direction: column;

    i {
      width: 18px;
      height: 18px;
      float: left;
      margin-right: 8px;
      opacity: 0.7;
    }
  `,
  legendItem: css`
    white-space: nowrap;
  `,
  gradientContainer: css`
    min-width: 200px;
    display: flex;
    justify-content: space-between;
    background-image: linear-gradient(to right, green, red);
  `,
  minVal: css `
    width: 10%;
  `,
  maxVal: css `
    width: 10%;
  `
}));
