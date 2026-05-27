import type { Pagination } from 'vitapress'
import { useSiteData } from 'vitapress'
import { computed, type View } from 'vitarx'
import { RouterLink, useRoute } from 'vitarx-router'
import type { SiteData } from '../types.js'

export default function DocFooter(): View {
  const siteData = useSiteData<SiteData>()
  const route = useRoute()
  const editLink = computed((): string | null => {
    if (siteData.edit) {
      return siteData.edit + route.meta['relativePath']
    }
    return null
  })
  const lastUpdateAt = computed(() => {
    return route.meta['lastUpdateAt'] || ''
  })
  const pagination = computed((): Pagination => {
    return route.meta['pagination'] || { prev: null, next: null }
  })
  return (
    <footer class="default-theme-doc-footer">
      <dl class="info">
        <dd>
          <svg
            width="14px"
            height="14px"
            color="currentColor"
            aria-hidden="true"
            aria-label="time-circle"
            viewBox="0 0 1024 1024"
          >
            <path
              d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64z m0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372z"
              fill="currentColor"
            ></path>
            <path
              d="M686.7 638.6L544.1 535.5V288c0-4.4-3.6-8-8-8H488c-4.4 0-8 3.6-8 8v275.4c0 2.6 1.2 5 3.3 6.5l165.4 120.6c3.6 2.6 8.6 1.8 11.2-1.7l28.6-39c2.6-3.7 1.8-8.7-1.8-11.2z"
              fill="currentColor"
            ></path>
          </svg>
          最后更新时间：
          <time datatime={lastUpdateAt}>{lastUpdateAt}</time>
        </dd>
        <dd v-if={editLink}>
          <a href={editLink.value as string} target="_blank">
            <svg
              width="14px"
              height="14px"
              color="currentColor"
              aria-hidden="true"
              aria-label="edit"
              viewBox="0 0 1024 1024"
            >
              <path
                d="M257.7 752c2 0 4-0.2 6-0.5L431.9 722c2-0.4 3.9-1.3 5.3-2.8l423.9-423.9c3.9-3.9 3.9-10.2 0-14.1L694.9 114.9c-1.9-1.9-4.4-2.9-7.1-2.9s-5.2 1-7.1 2.9L256.8 538.8c-1.5 1.5-2.4 3.3-2.8 5.3l-29.5 168.2c-1.9 11.1 1.5 21.9 9.4 29.8 6.6 6.4 14.9 9.9 23.8 9.9z m67.4-174.4L687.8 215l73.3 73.3-362.7 362.6-88.9 15.7 15.6-89zM880 836H144c-17.7 0-32 14.3-32 32v36c0 4.4 3.6 8 8 8h784c4.4 0 8-3.6 8-8v-36c0-17.7-14.3-32-32-32z"
                fill="currentColor"
              ></path>
            </svg>
            <span>帮助改进此文档</span>
          </a>
        </dd>
      </dl>
      <nav v-if={pagination.value.prev || pagination.value.next} class="pagination">
        <RouterLink
          v-if={pagination.value.prev}
          to={pagination.value.prev!.path}
          class="pagination-previous"
        >
          <small>
            <svg height="16" viewBox="0 0 10 16" width="10">
              <polyline
                fill="none"
                points="8,2 2,8 8,14"
                vector-effect="non-scaling-stroke"
              ></polyline>
            </svg>
            <span>PREVIOUS</span>
          </small>
          <p>{pagination.value.prev!.title}</p>
        </RouterLink>
        <div v-else></div>
        <RouterLink
          v-if={pagination.value.next}
          to={pagination.value.next!.path}
          class="pagination-next"
        >
          <small>
            <span>NEXT</span>
            <svg height="16" viewBox="0 0 10 16" width="10">
              <polyline
                fill="none"
                points="2,2 8,8 2,14"
                vector-effect="non-scaling-stroke"
              ></polyline>
            </svg>
          </small>
          <p>{pagination.value.next!.title}</p>
        </RouterLink>
      </nav>
      <div v-if={siteData.footer} class="content" v-html={siteData.footer}></div>
    </footer>
  )
}
