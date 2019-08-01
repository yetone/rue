import { useReducer, useEffect, Dispatch } from 'react'
import { render } from 'react-dom'
import objectPath from 'object-path'
import immutable from 'object-path-immutable'

interface IStringMap<T> {
  [key: string]: T,
}

interface IAction {
  type: 'set' | 'del',
  path: string[],
  value?: any,
}

function reducer(state: IStringMap<any>, action: IAction) {
  switch (action.type) {
    case 'set':
      return immutable.set(state, action.path, action.value)
    case 'del':
      return immutable.del(state, action.path)
    default:
      throw new Error(`reducer not support ${action.type} now!`)
  }
}

function useState<T extends IStringMap<any>>(obj: T): {[key in keyof T]: any} {
  const [state, dispatch] = useReducer(reducer, obj);

  return doUseState(state, dispatch, obj, [])
}

function doUseState<T extends IStringMap<any>, U extends IStringMap<any>>(
  state: U, dispatch: Dispatch<IAction>, obj: T, path: string[]): {[key in keyof T]: any} {
  const descriptors: PropertyDescriptorMap = Object.keys(obj).reduce((p, c) => {
    const origV = obj[c]

    if (Object.prototype.toString.call(origV) === '[object Object]') {
      let v = doUseState(state, dispatch, origV, [...path, c])

      return {
        ...p,
        [c]: {
          get() {
            return v
          },
          set(newV: any) {
            v = doUseState(state, dispatch, newV, [...path, c])
            dispatch({
              type: 'set',
              path: [...path, c],
              value: newV,
            })
          },
        },
      }
    }

    return {
      ...p,
      [c]: {
        get() {
          return objectPath.get(state, [...path, c])
        },
        set(newV: any) {
          dispatch({
            type: 'set',
            path: [...path, c],
            value: newV,
          })
        },
      },
    }
  }, {})

  return Object.defineProperties({}, descriptors)
}

export {
  useState,
  useEffect,
  render,
}