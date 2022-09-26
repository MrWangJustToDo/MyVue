<script setup lang="ts">
import { computed, onMounted, reactive, ref, toRaw } from "vue";
import { RouterLink, RouterView } from "vue-router";
import JsxTest from "./components/JsxTest";
import MethodTestVue from "./components/MethodTest.vue";
import HelloWorld from "./components/HelloWorld.vue";
const nodeRef = ref();
const data = reactive<{ a: null | any }>({ a: null });
const elementRef = ref();
const templateRef = ref();
onMounted(() => {
  console.log(nodeRef.value);
  console.log(elementRef.value);
  console.log(templateRef.value);
  console.log(data.a, data, toRaw(data.a));
});
const test = computed(() => data.a);
</script>

<template>
  <header>
    <img
      alt="Vue logo"
      class="logo"
      src="@/assets/logo.svg"
      width="125"
      height="125"
    />

    <div class="wrapper" ref="nodeRef">
      <MethodTestVue />
      <MethodTestVue />
      <MethodTestVue />
      <JsxTest />
      <HelloWorld msg="You did it!" />
      <span>{{ test }}</span>
      <button @click="($event) => (data.a = $event.clientX + $event.clientY)">
        test
      </button>
      <nav>
        <RouterLink to="/" ref="elementRef">Home</RouterLink>
        <RouterLink to="/about">About</RouterLink>
      </nav>
    </div>
  </header>

  <RouterView />
</template>

<style scoped>
header {
  line-height: 1.5;
  max-height: 100vh;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}

nav {
  width: 100%;
  font-size: 12px;
  text-align: center;
  margin-top: 2rem;
}

nav a.router-link-exact-active {
  color: var(--color-text);
}

nav a.router-link-exact-active:hover {
  background-color: transparent;
}

nav a {
  display: inline-block;
  padding: 0 1rem;
  border-left: 1px solid var(--color-border);
}

nav a:first-of-type {
  border: 0;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }

  nav {
    text-align: left;
    margin-left: -1rem;
    font-size: 1rem;

    padding: 1rem 0;
    margin-top: 1rem;
  }
}
</style>
