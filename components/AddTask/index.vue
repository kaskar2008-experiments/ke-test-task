<template lang="pug">
.add-task
  b-input-group
    b-form-input(v-model="newTask")
    b-input-group-append
      b-button(
        :disabled="!newTask"
        variant="info"
        @click="addTask"
      ) Добавить
</template>

<script lang="ts" src="./index.ts"></script>

<style lang="stylus">
.task-info
  .description-textarea
    margin-bottom .5rem

  .task-description
    button
      &:not(:last-child)
        margin-right 0.5rem
</style>
