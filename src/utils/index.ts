import type { App, Component } from 'vue'
import type { RouteLocationNormalized, RouteRecordNormalized } from 'vue-router'

import { cloneDeep, mergeWith, uniq } from 'lodash-es'
import { unref } from 'vue'
import { isArray, isObject } from '@/utils/is'

export const noop = () => {}

/**
 * @description:  Set ui mount node
 */
export function getPopupContainer(node?: HTMLElement): HTMLElement {
  return (node?.parentNode as HTMLElement) ?? document.body
}

/**
 * Add the object as a parameter to the URL
 * @param baseUrl url
 * @param obj
 * @returns {string}
 * eg:
 *  let obj = {a: '3', b: '4'}
 *  setObjToUrlParams('www.baidu.com', obj)
 *  ==>www.baidu.com?a=3&b=4
 */
export function setObjToUrlParams(baseUrl: string, obj: any): string {
  let parameters = ''
  for (const key in obj) {
    parameters += key + '=' + encodeURIComponent(obj[key]) + '&'
  }
  parameters = parameters.replace(/&$/, '')
  return /\?$/.test(baseUrl) ? baseUrl + parameters : baseUrl.replace(/\/?$/, '?') + parameters
}

/**
 * 递归合并两个对象。
 * Recursively merge two objects.
 * @param target 目标对象，合并后结果存放于此。The target object to merge into.
 * @param source 要合并的源对象。The source object to merge from.
 * @returns 合并后的对象。The merged object.
 */
export function deepMerge<T extends object | null | undefined, U extends object | null | undefined>(target: T, source: U): T & U {
  return mergeWith(cloneDeep(target), source, (objValue, srcValue) => {
    if (isObject(objValue) && isObject(srcValue)) {
      return mergeWith(cloneDeep(objValue), srcValue, (prevValue, nextValue) => {
        // 如果是数组，合并数组(去重) If it is an array, merge the array (remove duplicates)
        return isArray(prevValue) ? uniq(prevValue, nextValue) : undefined
      })
    }
  })
}

export function openWindow(url: string, opt?: { target?: TargetContext | string; noopener?: boolean; noreferrer?: boolean }) {
  const { target = '__blank', noopener = true, noreferrer = true } = opt || {}
  const feature: string[] = []

  noopener && feature.push('noopener=yes')
  noreferrer && feature.push('noreferrer=yes')

  window.open(url, target, feature.join(','))
}

// dynamic use hook props
export function getDynamicProps<T extends Record<string, unknown>, U>(props: T): Partial<U> {
  const ret: Recordable = {}

  Object.keys(props).map((key) => {
    ret[key] = unref((props as Recordable)[key])
  })

  return ret as Partial<U>
}

export function getRawRoute(route: RouteLocationNormalized): RouteLocationNormalized {
  if (!route) return route
  const { matched, ...opt } = route
  return {
    ...opt,
    matched: (matched
      ? matched.map((item) => ({
          meta: item.meta,
          name: item.name,
          path: item.path
        }))
      : undefined) as RouteRecordNormalized[]
  }
}

// https://github.com/vant-ui/vant/issues/8302
type EventShim = {
  new (...args: any[]): {
    $props: {
      onClick?: (...args: any[]) => void
    }
  }
}

export type WithInstall<T> = T & {
  install(app: App): void
} & EventShim

export type CustomComponent = Component & { displayName?: string }

export const withInstall = <T extends CustomComponent>(component: T, alias?: string) => {
  ;(component as Record<string, unknown>).install = (app: App) => {
    const compName = component.name || component.displayName
    if (!compName) return
    app.component(compName, component)
    if (alias) {
      app.config.globalProperties[alias] = component
    }
  }
  return component as WithInstall<T>
}

/**
 * 简单实现防抖方法
 *
 * 防抖(debounce)函数在第一次触发给定的函数时，不立即执行函数，而是给出一个期限值(delay)，比如100ms。
 * 如果100ms内再次执行函数，就重新开始计时，直到计时结束后再真正执行函数。
 * 这样做的好处是如果短时间内大量触发同一事件，只会执行一次函数。
 *
 * @param fn 要防抖的函数
 * @param delay 防抖的毫秒数
 * @returns {Function}
 */
export function simpleDebounce(fn, delay = 100) {
  let timer: any | null = null
  return function () {
    // eslint-disable-next-line prefer-rest-params
    const args = arguments
    if (timer) {
      clearTimeout(timer)
    }
    timer = setTimeout(() => {
      // @ts-ignore
      fn.apply(this, args)
    }, delay)
  }
}
