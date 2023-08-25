import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  Form,
  useActionData,
  useLoaderData,
  useNavigation,
} from "@remix-run/react";
import invariant from "tiny-invariant";

import {
  createPost,
  deletePost,
  getPost,
  updatePost,
} from "~/models/post.server";

export const loader = async ({ params }: LoaderArgs) => {
  invariant(params.slug, "params.slug is required");
  if (params.slug === "new") {
    return json({});
  }
  const post = await getPost(params.slug);
  invariant(post, `Post not found: ${params.slug}`);
  return json({ post });
};

export const action = async ({ request, params }: ActionArgs) => {
  const formData = await request.formData();
  const intent = formData.get("intent");

  invariant(typeof params.slug === "string", "invalid url");

  if (intent === "delete") {
    await deletePost(params.slug);
    return redirect("/posts/admin");
  }

  const title = formData.get("title");
  const slug = formData.get("slug");
  const markdown = formData.get("markdown");

  const errors = {
    title: title ? null : "Title is required",
    slug: slug ? null : "Slug is required",
    markdown: markdown ? null : "Markdown is required",
  };
  const hasErrors = Object.values(errors).some((errorMessage) => errorMessage);
  if (hasErrors) {
    return json(errors);
  }

  invariant(typeof title === "string", "title must be a string");
  invariant(typeof slug === "string", "slug must be a string");
  invariant(typeof markdown === "string", "markdown must be a string");

  if (params.slug === "new") {
    await createPost({ title, slug, markdown });
  } else {
    await updatePost(params.slug, { title, slug, markdown });
  }
  return redirect("/posts/admin");
};

const inputClassName =
  "w-full rounded border border-gray-500 px-2 py-1 text-lg";

export default function NewPost() {
  const errors = useActionData<typeof action>();
  const navigation = useNavigation();
  let isUpdating = false;
  let isCreating = false;
  let isDeleting = false;
  if (typeof navigation.formData !== "undefined") {
    isUpdating = navigation.formData.get("intent") === "update";
    isCreating = navigation.formData.get("intent") === "create";
    isDeleting = navigation.formData.get("intent") === "delete";
  }

  const { post } = useLoaderData();
  const isNewPost = !post;

  return (
    <Form method="post" key={post?.slug ?? "new"}>
      <p>
        <label htmlFor="title">Post Title: </label>
        <input
          id="title"
          type="text"
          name="title"
          className={inputClassName}
          defaultValue={post?.title}
        />
        {errors?.title ? (
          <>
            <br />
            <em className="text-red-600">{errors.title}</em>
          </>
        ) : null}
      </p>
      <p>
        <label htmlFor="slug">Post Slug:</label>
        <br />
        <input
          id="slug"
          type="text"
          name="slug"
          className={inputClassName}
          defaultValue={post?.slug}
        />
        {errors?.slug ? (
          <>
            <br />
            <em className="text-red-600">{errors.slug}</em>
          </>
        ) : null}
      </p>
      <p>
        <label htmlFor="markdown">Markdown: </label>
        <br />
        <textarea
          id="markdown"
          rows={20}
          name="markdown"
          className={`${inputClassName} font-mono`}
          defaultValue={post?.markdown}
        />
        {errors?.markdown ? (
          <>
            <br />
            <em className="text-red-600">{errors.markdown}</em>
          </>
        ) : null}
      </p>
      <div className="flex justify-end gap-4">
        {isNewPost ? null : (
          <button
            type="submit"
            disabled={isDeleting}
            name="intent"
            value="delete"
            className="rounded bg-red-500 py-2 px-4 text-white hover:bg-red-600 focus:bg-red-400 disabled:bg-red-300"
          >
            {isDeleting ? "Deleting" : "Delete"}
          </button>
        )}
        <button
          type="submit"
          disabled={isCreating || isUpdating}
          name="intent"
          value={isNewPost ? "create" : "update"}
          className="rounded bg-blue-500 py-2 px-4 text-white hover:bg-blue-600 focus:bg-blue-400 disabled:bg-blue-300"
        >
          {isNewPost ? (isCreating ? "Creating" : "Create Post") : null}
          {isNewPost ? null : isUpdating ? "Updating" : "Update"}
        </button>
      </div>
    </Form>
  );
}
