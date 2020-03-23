<template lang="pug">
  .app
    b-spinner(
      v-if="isLoading"
    )
    template(v-else)
      .project-title
        b-input-group(v-if="isTitleEditing")
          b-form-input(
            v-model="newTitle"
          )
          b-input-group-append
            b-button(
              variant="danger"
              @click="stopTitleEdit"
            ) Отменить
            b-button(
              variant="success"
              @click="saveNewTitle"
            ) Сохранить
        h1(v-else) {{ title }}
          b-button.edit-btn(variant="light" @click="startTitleEdit")
            b-icon(icon="pencil")

      .tasks
        b-form-group.search-group(
          label="Поиск"
        )
          b-form-input(v-model="search")

        b-form-group.filter-group(
          label="Фильтрация"
        )
          b-form-radio-group(
            v-model="selectedFilter"
            :options="filterOptions"
          )

          b-form-checkbox(
            v-model="isAlwaysFlat"
          ) Развернуть подзадачи в один список

          b-button(
            v-if="isShowCleanUp"
            variant="light"
            @click="cleanUp"
          ) Почистить корзину

        add-task

        .list
          task-item(
            v-for="task in taskList"
            :key="task._uid"
            :task="task"
          )

        template(v-if="search && taskList.length === 0")
          h5 Поиск не дал результатов

        template(v-if="!search && taskList.length === 0")
          h5 Заданий пока нет

    b-modal(
      ok-only
      scrollable
      id="task-info-modal"
      size="lg"
      v-model="isTaskInfoShown"
      :title="openedTask ? openedTask.title : ''"
    )
      task-info(
        :task="openedTask"
        :project="projectInfo"
        :project-list="projectList"
      )
</template>

<script lang="ts" src="./index.ts"></script>

<style lang="stylus">
.edit-btn
  margin-left .5rem

.project-title
  margin-bottom 1rem

.tasks
  .add-task
    margin-bottom 16px
</style>
