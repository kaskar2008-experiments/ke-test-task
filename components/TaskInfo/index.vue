<template lang="pug">
  .task-info(
    v-if="task"
  )
    template(v-if="task.parent")
      h5.parent-info(@click="openParentTask")
        b-icon(icon="arrow-bar-left")
        template {{ task.parent.title }}

      hr

    .task-project
      h6 Проект:
      b-form-select(
        v-model="taskProject"
        :options="projectList"
        value-field="uid"
        text-field="title"
      )

    .task-description
      h6 Описание:
      template(v-if="!isDescriptionEdit")
        p(v-if="task.description") {{ task.description }}
        .edit-description
          b-button(
            variant="info"
            size="sm"
            @click="startEditDescription"
          )
            template(v-if="task.description") Редактировать
            template(v-else) Добавить описание

      template(v-else)
        b-form-textarea.description-textarea(
          v-model="newDescription"
          rows="3"
          max-rows="7"
        )
        b-button(
          variant="danger"
          @click="stopDescriptionEdit"
        ) Отменить
        b-button(
          variant="success"
          @click="saveNewDescription"
        ) Сохранить

    hr

    .children
      h6 Подзадачи:

      add-task(:parent="task")

      task-item(
        v-for="child in childrenFiltered"
        :key="child._uid"
        :task="child"
      )

  h3(v-else) Что-то пошло явно не так...
</template>

<script lang="ts" src="./index.ts"></script>

<style lang="stylus">
.task-info
  .parent-info
    color #3a99ff
    border-bottom: 1px dotted #3a99ff
    cursor pointer
    display inline-block
    margin-bottom 1rem

  .description-textarea
    margin-bottom .5rem

  .task-project
    margin-bottom 1rem

  .task-description
    margin-bottom 1rem
    button
      &:not(:last-child)
        margin-right 0.5rem

  .add-task
    margin-bottom 1rem
</style>
