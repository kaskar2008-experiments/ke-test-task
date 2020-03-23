import Vue from 'vue';
import { BootstrapVueIcons } from 'bootstrap-vue';
import TaskItem, { ITaskItem } from '~/components/TaskItem';
import TaskInfo from '~/components/TaskInfo';
import AddTask from '~/components/AddTask';

Vue.use(BootstrapVueIcons);

export const enum EFilter {
  DONE = 'done',
  NOT_DONE = 'notDone',
  ALL = 'all',
  TRASH = 'trash',
}

export const enum EBroadcastEvent {
  PROJECT_INFO = 'project.info',
  HELLO = 'hello',
  TASK_MOVEMENT = 'task.movement',
}

export interface IBroadcastMessage<T = any> {
  event: EBroadcastEvent;
  payload: T;
}

export interface ITaskMovementEventPayload {
  newProjectUid: string;
  task: ITaskItem;
}

export interface IProjectBroadcastInfo {
  uid: string;
  title: string;
}

const DefaultBroadcastChannel = 'todo-test-app';

const DefaultProjectName = 'Новый проект';
const DefaultFilter = 'all';
const filtersMap: {[key: string]: any} = {
  [EFilter.DONE]: (task: ITaskItem) => task.isDone && task.visible,
  [EFilter.NOT_DONE]: (task: ITaskItem) => !task.isDone && task.visible,
  [EFilter.ALL]: (task: ITaskItem) => task.visible,
  [EFilter.TRASH]: (task: ITaskItem) => !task.visible,
};

export function setTaskVisibility(
  task: ITaskItem,
  visible: boolean
) {
  task.visible = visible;
}

export function traverseDeep<
  T extends object,
  U extends keyof T
>(
  input: T,
  childrenKey: U,
  predicate: (el: T) => void
) {
  predicate(input);

  if (Array.isArray(input[childrenKey])) {
    (input[childrenKey] as unknown as T[]).forEach(el => traverseDeep(el, childrenKey, predicate));
  }
}

export function flatDeep(inputArray: any[], childrenKey: string = 'children'): any[] {
  let arr = [...inputArray];

  return arr.reduce((acc, val) => {
    if (Array.isArray(val[childrenKey])) {
      acc.push(...flatDeep(val[childrenKey]));
    }

    let newVal = {
      ...val,
      [childrenKey]: null,
    };

    acc.push(newVal);

    return acc;
  }, []);
}

export default Vue.extend({
  name: 'main-page',
  components: {
    TaskItem,
    TaskInfo,
    AddTask,
  },
  data() {
    return {
      title: DefaultProjectName,
      uid: '',
      newTitle: '',
      isTitleEditing: false,

      search: '',

      isLoading: true,
      isTaskInfoShown: false,

      isUpvoteNotDone: false,
      isAlwaysFlat: false,

      tasks: [] as ITaskItem[],
      flatTaskList: {} as { [key: string]: ITaskItem},
      projectList: [] as IProjectBroadcastInfo[],

      openedTask: null as ITaskItem | null,

      selectedFilter: 'all',
      filterOptions: [
        { text: 'Сделать', value: 'notDone' },
        { text: 'Готовые', value: 'done' },
        { text: 'Все', value: 'all' },
        { text: 'Удалённые', value: 'trash' }
      ],

      bc: null as BroadcastChannel | null,
    };
  },
  computed: {
    projectInfo(): IProjectBroadcastInfo {
      return {
        title: this.title,
        uid: this.uid,
      };
    },
    flatList(): ITaskItem[] {
      return Object.values(this.flatTaskList);
    },
    sourceList(): ITaskItem[] {
      return this.isAlwaysFlat || this.selectedFilter === EFilter.TRASH ? this.flatList : this.tasks;
    },
    taskList(): ITaskItem[] {
      return this.sourceList
        .filter(el => {
          const filterPredicate = filtersMap[this.selectedFilter] || filtersMap[EFilter.ALL];

          return filterPredicate(el) && this.findTasksPredicate(el);
        })
        .sort((a, b) => b.createdAt - a.createdAt);
    },
    hasTrash(): boolean {
      return this.flatList.filter(task => !task.visible).length > 0;
    },
    isShowCleanUp(): boolean {
      return this.hasTrash && this.selectedFilter === EFilter.TRASH;
    },
  },
  created() {
    this.$root.$on('remove-task', this.removeTask);
    this.$root.$on('update-task', this.saveTasks);
    this.$root.$on('open-task', this.openTask);
    this.$root.$on('close-task', this.closeTask);
    this.$root.$on('open-task-by-uid', this.openTaskByUid);
    this.$root.$on('add-task', this.addTask);
    this.$root.$on('task-movement', this.sendTask);
  },
  mounted() {
    this.loadProjectInfo();
    this.loadFilter();
    this.loadTasks();
    this.isLoading = false;

    if (!this.uid) {
      this.uid = `project-${new Date().getTime()}-${Math.random()}`;
      this.saveProjectUid();
    }

    this.projectList.push(this.projectInfo);

    this.bc = new BroadcastChannel(DefaultBroadcastChannel);
    this.bc.onmessage = (ev) => {
      switch ((ev.data as IBroadcastMessage).event) {
        case EBroadcastEvent.PROJECT_INFO:
          this.onNewProject(ev.data.payload);
          break;

        case EBroadcastEvent.HELLO:
          this.sendProjectInfo();
          break;

        case EBroadcastEvent.TASK_MOVEMENT:
          let taskMovementPayload: ITaskMovementEventPayload = ev.data.payload;

          if (taskMovementPayload.newProjectUid === this.projectInfo.uid) {
            this.addTask(taskMovementPayload.task);
          }
          break;

        default:
          break;
      }
    };
    this.sayHello();
  },
  beforeDestroy() {
    this.$root.$off('remove-task', this.removeTask);
    this.$root.$off('update-task', this.saveTasks);
    this.$root.$off('open-task', this.openTask);
    this.$root.$off('close-task', this.closeTask);
    this.$root.$off('open-task-by-uid', this.openTaskByUid);
    this.$root.$off('add-task', this.addTask);
    this.$root.$off('task-movement', this.sendTask);

    if (this.bc) {
      this.bc.close();
    }
  },
  methods: {
    // Title
    startTitleEdit() {
      this.newTitle = this.title;
      this.isTitleEditing = true;
    },
    saveNewTitle() {
      this.title = this.newTitle;
      this.isTitleEditing = false;
      this.saveProject();
    },
    stopTitleEdit() {
      this.newTitle = this.title;
      this.isTitleEditing = false;
    },

    // Tasks
    addTask(newTask: ITaskItem, parent?: ITaskItem) {
      if (parent) {
        parent.children.push(newTask);
      } else {
        this.tasks.push(newTask);
      }

      this.$set(this.flatTaskList, newTask._uid, newTask);

      this.saveTasks();
    },
    openTaskByUid(uid: string) {
      this.openTask(this.flatTaskList[uid]);
    },
    removeTask(task: ITaskItem) {
      this.$bvModal.msgBoxConfirm('Действительно удалить таску?')
        .then((isConfirmed: boolean) => {
          if (!isConfirmed) {
            return;
          }

          traverseDeep(task, 'children', task => setTaskVisibility(task, false));
        })
        .catch();
    },
    openTask(task: ITaskItem) {
      this.$set(this, 'openedTask', task);
    },
    closeTask() {
      this.$set(this, 'openedTask', null);
    },
    findTasksPredicate(task: ITaskItem) {
      const textToFind = this.search.toLowerCase();

      return task.title.toLowerCase().includes(textToFind)
        || task.description.toLowerCase().includes(textToFind);
    },

    cleanUp() {
      this.$bvModal.msgBoxConfirm('Действительно почистить корзину?')
        .then((isConfirmed: boolean) => {
          if (!isConfirmed) {
            return;
          }

          const filterTasks = (tasks: ITaskItem[]) => {
            let visibleTasks = tasks.filter(el => el.visible);
            tasks.splice(0);
            tasks.push(...visibleTasks);
            tasks.forEach(el => filterTasks(el.children));
          };

          filterTasks(this.tasks);
          this.updateFlat();
          this.saveTasks();
        })
        .catch();
    },
    updateFlat() {
      this.flatTaskList = {};

      const addToFlat = (task: ITaskItem) => {
        this.$set(this.flatTaskList, task._uid, task);

        task.children.forEach(addToFlat);
      };

      this.tasks.forEach(addToFlat);
    },


    // Broadcast
    sayHello() {
      this.bc?.postMessage({
        event: EBroadcastEvent.HELLO,
      } as IBroadcastMessage<IProjectBroadcastInfo>);

      this.sendProjectInfo();
    },
    onNewProject(projectInfo: IProjectBroadcastInfo) {
      const foundProject = this.projectList.find(project => project.uid === projectInfo.uid);

      if (!foundProject) {
        this.projectList.push(projectInfo);
      } else {
        foundProject.title = projectInfo.title;
      }
    },
    sendProjectInfo() {
      this.bc?.postMessage({
        event: EBroadcastEvent.PROJECT_INFO,
        payload: this.projectInfo,
      } as IBroadcastMessage<IProjectBroadcastInfo>);
    },
    sendTask(task: ITaskItem, projectUid: string) {
      this.bc?.postMessage({
        event: EBroadcastEvent.TASK_MOVEMENT,
        payload: {
          newProjectUid: projectUid,
          task: { ...task },
        },
      } as IBroadcastMessage<ITaskMovementEventPayload>);

      task.visible = false;
    },


    // Storage
    saveTasks() {
      sessionStorage.setItem('taskList', JSON.stringify(this.tasks));
    },
    saveProject() {
      sessionStorage.setItem('projectTitle', this.title);
    },
    saveProjectUid() {
      sessionStorage.setItem('projectUid', this.uid);
    },
    saveFilter() {
      sessionStorage.setItem('filter', this.selectedFilter);
    },
    saveIsAlwaysFlat() {
      sessionStorage.setItem('isAlwaysFlat', String(+this.isAlwaysFlat));
    },
    loadTasks() {
      try {
        this.tasks = JSON.parse(sessionStorage.getItem('taskList') || '') || [];
      } catch (error) {
        this.tasks = [];
      }

      this.updateFlat();
    },
    loadProjectInfo() {
      this.title = sessionStorage.getItem('projectTitle') || DefaultProjectName;
      this.uid = sessionStorage.getItem('projectUid') || '';
    },
    loadFilter() {
      this.selectedFilter = sessionStorage.getItem('filter') || DefaultFilter;
      this.loadIsAlwaysFlat();
    },
    loadIsAlwaysFlat() {
      this.isAlwaysFlat = !!Number(sessionStorage.getItem('isAlwaysFlat'));
    },
  },
  watch: {
    title() {
      this.sendProjectInfo();

      const foundProject = this.projectList.find(project => project.uid === this.projectInfo.uid);

      if (foundProject) {
        foundProject.title = this.projectInfo.title;
      }
    },
    selectedFilter() {
      this.saveFilter();
    },
    isAlwaysFlat() {
      this.saveIsAlwaysFlat();
    },
    openedTask(task: ITaskItem | null) {
      if (task) {
        this.$bvModal.show('task-info-modal');
      } else {
        this.$bvModal.hide('task-info-modal');
      }
    },
    isTaskInfoShown(val: boolean) {
      if (!val) {
        this.closeTask();
      }
    },
  },
});
