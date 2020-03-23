<template lang="pug">
  .task-item.d-flex.justify-content-between.align-items-center(
    v-if="task"
    :class="{ done: task.isDone, trash: !task.visible }"
  )
    b-form-checkbox(v-model="task.isDone")
    .task-title
      span(
        v-if="!isTitleEdit"
        @click.self.stop="startEditTitle"
      ) {{ task.title }}
      b-form-input(
        v-else
        size="sm"
        v-model="newTitle"
        @blur="saveNewTitle"
        autofocus
      )
    .children-info(v-if="childrenFiltered && childrenFiltered.length > 0")
      b-icon(
        v-b-tooltip.hover
        icon="list-check"
        :title="`Подзадач: ${childrenFiltered.length}`"
      )
    .details-btn(@click="openTask")
      b-icon(icon="arrow-bar-right")
    .delete-btn(
      v-if="task.visible"
      @click="removeTask"
    )
      b-icon(icon="trash")
    .restore-btn(
      v-else
      @click="restoreTask"
    )
      b-icon(icon="arrow-counterclockwise")
</template>

<script lang="ts" src="./index.ts"></script>

<style lang="stylus">
.task-item
  border-radius .25rem
  border 1px solid rgba(0, 0, 0, 0.125)
  padding .5rem

  &:not(:last-child)
    margin-bottom 0.25rem

  &.done
    color rgba(0,0,0,.3)

  &.trash
    text-decoration line-through
    background-color rgba(255,20,20,.05)

  .task-title
    text-overflow ellipsis
    white-space nowrap
    overflow hidden
    margin 0 0.25rem
    font-size 0.875rem
    flex-grow 1

    input
      padding 0 !important
      height auto

  .details-btn,
  .delete-btn,
  .restore-btn
    cursor pointer
    padding 0 0.5rem
</style>
